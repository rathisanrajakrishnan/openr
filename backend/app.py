from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
from zoneinfo import ZoneInfo
import requests
import json
import math

app = Flask(__name__)
CORS(app)

UW_OPEN_CLASSROOMS_URL = "https://portalapi2.uwaterloo.ca/v2/map/OpenClassrooms"
TORONTO_TZ = ZoneInfo("America/Toronto")

current_time = now_toronto().time()

def now_toronto():
    return datetime.now(TORONTO_TZ)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def weekday_name():
    return now_toronto().strftime("%A")

def get_today_slots(schedule_list, today):
    for entry in schedule_list or []:
        if entry.get("Weekday") == today:
            return entry.get("Slots", [])
    return []

def get_slot_status(current_time, start_time_str, end_time_str):
    start_time = datetime.strptime(start_time_str, "%H:%M:%S").time()
    end_time = datetime.strptime(end_time_str, "%H:%M:%S").time()

    # UW “24/7” convention: 00:00:00 → 00:00:00 means open all day
    if start_time == end_time:
        return "available"

    # upcoming within 20 minutes
    minutes_until = (
        datetime.combine(datetime.today(), start_time) -
        datetime.combine(datetime.today(), current_time)
    ).total_seconds() / 60

    if 0 < minutes_until < 20:
        return "upcoming"
    elif start_time <= current_time <= end_time:
        return "available"
    elif current_time > end_time:
        return "passed"
    else:
        return "unavailable"

@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"message": "Test route is working!"})

@app.route("/api/open-classrooms", methods=["GET", "POST"])
def get_open_classrooms():
    user_lat = 0
    user_lng = 0

    if request.method == "POST":
        user_location = request.get_json(silent=True)
        if not user_location:
            return jsonify({"error": "No data provided"}), 400

        user_lat = user_location.get("lat")
        user_lng = user_location.get("lng")

        if user_lat is None or user_lng is None:
            return jsonify({"error": "Invalid location data. 'lat' and 'lng' are required."}), 400

    r = requests.get(UW_OPEN_CLASSROOMS_URL, timeout=15)
    data = r.json()

    now_dt = current_time
    current_time = now_dt.time()
    today = weekday_name(now_dt)

    building_info_list = []

    for feature in data.get("data", {}).get("features", []):
        props = feature.get("properties", {})
        building_name = props.get("buildingName")
        building_code = props.get("buildingCode")
        building_coords = feature.get("geometry", {}).get("coordinates", [0, 0])

        open_slots_str = props.get("openClassroomSlots")

        # If UW provides no slot data, treat as unavailable (no "closed" state)
        if not open_slots_str:
            building_info_list.append({
                "building": building_name,
                "building_code": building_code,
                "building_status": "unavailable",
                "rooms": {},
                "coords": building_coords,
                "distance": haversine(user_lat, user_lng, building_coords[1], building_coords[0])
                            if user_lat and user_lng else 0
            })
            continue

        open_classroom_slots = json.loads(open_slots_str)
        rooms = {}

        # Only statuses you want: available / upcoming / unavailable
        building_status = "unavailable"

        for room in open_classroom_slots.get("data", []):
            room_number = room.get("roomNumber")
            schedule = room.get("Schedule", [])

            slots = get_today_slots(schedule, today)

            # No slots today => unavailable (no "closed")
            if not slots:
                rooms[room_number] = {"slots": []}
                continue

            slots_with_status = []
            saw_available = False
            saw_upcoming = False
            saw_future_unavailable = False

            for slot in slots:
                start_time = slot["StartTime"]
                end_time = slot["EndTime"]
                status = get_slot_status(current_time, start_time, end_time)

                if status == "available":
                    saw_available = True
                elif status == "upcoming":
                    saw_upcoming = True
                elif status == "unavailable":
                    # means this slot is later today but not within 20 mins yet
                    saw_future_unavailable = True

                # Keep only non-passed slots for display
                if status != "passed":
                    slots_with_status.append({
                        "StartTime": start_time,
                        "EndTime": end_time,
                        "Status": status
                    })

            # If everything passed, show nothing (still unavailable)
            rooms[room_number] = {"slots": slots_with_status}

            # Building status priority: available > upcoming > unavailable
            if saw_available:
                building_status = "available"
            elif saw_upcoming and building_status != "available":
                building_status = "upcoming"
            elif saw_future_unavailable and building_status not in ("available", "upcoming"):
                building_status = "unavailable"

        building_info_list.append({
            "building": building_name,
            "building_code": building_code,
            "building_status": building_status,
            "rooms": rooms,
            "coords": building_coords,
            "distance": haversine(user_lat, user_lng, building_coords[1], building_coords[0])
                        if user_lat and user_lng else 0
        })

    if user_lat and user_lng:
        building_info_list.sort(key=lambda x: x["distance"])

    return jsonify(building_info_list)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080, debug=True)