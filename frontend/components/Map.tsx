"use client";
import React from "react";
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface dataFormat {
    building: string;
    building_code: string;
    building_status: string;
    rooms: {
        [key: string]: {
            roomNumber: string;
            slots: { StartTime: string; EndTime: string; Status: string }[];
        };
    };
    coords: [number, number];
    distance: number;
}

export default function Map({
    data,
    handleMarkerClick,
    userPos,
}: {
    data: dataFormat[];
    handleMarkerClick: (building: string) => void;
    userPos: any;
}) {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);

    const [center, setCenter] = useState<[number, number]>([-80.5425, 43.4695]);
    const [zoom, setZoom] = useState(16.25);
    const [pitch, setPitch] = useState(52);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

    function normalizeStatus(status: any) {
    const s = String(status ?? "").trim().toLowerCase();
    if (s === "available" || s === "upcoming" || s === "unavailable") return s;
    return "unavailable";
    }

    function getColorByStatus(status: any) {
    const s = normalizeStatus(status);

    switch (s) {
        case "available":
        return "h-2 w-2 rounded-full bg-green-400 shadow-[0px_0px_4px_2px_rgba(34,197,94,0.7)]";
        case "upcoming":
        return "h-2 w-2 rounded-full bg-amber-400 shadow-[0px_0px_4px_2px_rgba(245,158,11,0.9)]";
        case "unavailable":
        default:
        return "h-2 w-2 rounded-full bg-red-400 shadow-[0px_0px_4px_2px_rgba(239,68,68,0.9)]";
    }
    }

    // 1) create map once
    useEffect(() => {
    if (!mapboxToken) {
        console.error("Mapbox token is not defined");
        return;
    }
    if (mapRef.current) return; // prevent re-init

    mapboxgl.accessToken = mapboxToken;

    mapRef.current = new mapboxgl.Map({
        style: "mapbox://styles/rathisanr/cmk4ttxdu000c01s51i5p4otb",
        container: mapContainerRef.current as HTMLElement,
        center,
        zoom,
        pitch,
    });

    mapRef.current.on("move", () => {
        if (!mapRef.current) return;
        const mapCenter = mapRef.current.getCenter();
        setCenter([mapCenter.lng, mapCenter.lat]);
        setZoom(mapRef.current.getZoom());
        setPitch(mapRef.current.getPitch());
    });

    return () => {
        mapRef.current?.remove();
        mapRef.current = null;
    };
    }, [mapboxToken]); // <-- only depends on token

    // 2) update building markers when data changes
    useEffect(() => {
    if (!mapRef.current) return;

    // clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // add new markers
    data.forEach((b) => {
        if (!b?.coords || b.coords.length !== 2) return;

        const el = document.createElement("div");
        el.className = getColorByStatus(b.building_status);

        el.addEventListener("click", () => {
        const accordionItem = document.getElementById(b.building_code);
        setTimeout(() => {
            accordionItem?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);

        handleMarkerClick(b.building_code);
        });

        const marker = new mapboxgl.Marker(el)
        .setLngLat([b.coords[0], b.coords[1]])
        .addTo(mapRef.current!);

        markersRef.current.push(marker);
    });
    }, [data, handleMarkerClick]); // <-- reruns when data updates

    // 3) update user marker when userPos changes
    useEffect(() => {
    if (!mapRef.current) return;

    userMarkerRef.current?.remove();
    userMarkerRef.current = null;

    if (!userPos) return;

    const el = document.createElement("div");
    el.className =
        "h-3 w-3 border-[1.5px] border-zinc-50 rounded-full bg-blue-400 shadow-[0px_0px_4px_2px_rgba(14,165,233,1)]";

    userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userPos[1], userPos[0]])
        .addTo(mapRef.current);
    }, [userPos]);

    return (
        <div className="h-[60vh] sm:w-full sm:h-full relative bg-red-500/0 rounded-[20px] p-2 sm:p-0">
            <div
                id="map-container"
                ref={mapContainerRef}
                className="opacity-100"
            />
            <div className="bg-[#18181b]/90 absolute bottom-10 left-2 sm:bottom-8 sm:left-0 flex flex-col gap-2 m-1 py-2.5 p-2 rounded-[16px]">
                <div className="flex items-center gap-0">
                    <div className="h-2 w-2 rounded-full bg-red-400 flex-none"></div>
                    <div className="ml-2 rounded-lg px-2 py-1 text-sm w-full bg-red-700/30 text-red-300/90">
                        unavailable
                    </div>
                </div>
                <div className="flex items-center gap-0">
                    <div className="h-2 w-2 rounded-full bg-amber-400 flex-none"></div>
                    <div className="ml-2 rounded-lg px-2 py-1 text-sm w-full bg-amber-800/30 text-amber-300/90">
                        opening soon
                    </div>
                </div>
                <div className="flex items-center gap-0">
                    <div className="h-2 w-2 rounded-full bg-green-400 flex-none"></div>
                    <div className="ml-2 rounded-lg px-2 py-1 text-sm w-full bg-green-800/30 text-green-300/90">
                        open now
                    </div>
                </div>
            </div>
        </div>
    );
}
