import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import lookup from "country-code-lookup";

import "./App.scss";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYXpyaWxoYWZpemkiLCJhIjoiY2s4cHk3djdiMGNteDNsbXh3cHh2eTVsYSJ9.zQLDEYu1S4rU7sJQIf57NQ";

function App() {
  const mapboxElRef = useRef(null);
  const fetcher = (url) =>
    fetch(url)
      .then((r) => r.json())
      .then((data) =>
        data.map((point, index) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              point.coordinates.longitude,
              point.coordinates.latitude,
            ],
          },
          properties: {
            id: index,
            country: point.country,
            province: point.province,
            cases: point.stats.confirmed,
            deaths: point.stats.deaths,
            recovered: point.stats.recovered,
          },
        }))
      );
  const { data } = useSWR("https://corona.lmao.ninja/v2/jhucsse", fetcher);

  useEffect(() => {
    if (data) {
      const map = new mapboxgl.Map({
        container: mapboxElRef.current,
        style: "mapbox://styles/azrilhafizi/ck8pypcpj0nww1imub2y68lxi",
        center: [120, 4],
        zoom: 2,
      });
      map.addControl(new mapboxgl.NavigationControl());
      map.once("load", function () {
        map.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: data,
          },
        });
        map.addLayer({
          id: "circles",
          source: "points",
          type: "circle",
          paint: {
            "circle-opacity": 0.75,
            "circle-stroke-width": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              1,
              100000,
              1.75,
              500000,
              2,
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              4,
              1000,
              8,
              4000,
              10,
              8000,
              14,
              12000,
              18,
              100000,
              25,
              500000,
              40,
              1000000,
              80,
            ],
            "circle-color": [
              "interpolate",
              ["linear"],
              ["get", "cases"],
              1,
              "#ffffcc",
              5000,
              "#ffeda0",
              10000,
              "#fed976",
              25000,
              "#feb24c",
              50000,
              "#fd8d3c",
              75000,
              "#fc4e2a",
              100000,
              "#e31a1c",
              500000,
              "#bd0026",
              1000000,
              "#800026",
            ],
          },
        });

        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false,
        });

        let lastId;

        map.on("mousemove", "circles", (e) => {
          const id = e.features[0].properties.id;

          if (id !== lastId) {
            lastId = id;

            map.getCanvas().style.cursor = "pointer";

            const {
              cases,
              deaths,
              country,
              province,
              recovered,
            } = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates.slice();

            const countryISO =
              lookup.byCountry(country)?.iso2 ||
              lookup.byInternet(country)?.iso2;
            const provinceHTML =
              province !== "null"
                ? `<p>
                  Provience: <b>${province}</b>
                </p>`
                : "";
            const mortalityRate = ((deaths / cases) * 100).toFixed(2);
            const countryFlagHTML = Boolean(countryISO)
              ? `<img src="https://www.countryflags.io/${countryISO}/flat/64.png"></img>`
              : "";

            const HTML = `<p>Country: <b>${country}</b></p>
                ${provinceHTML}
                <p>Cases: <b>${cases}</b></p>
                <p>Recovered: <b>${recovered}</b></p>
                <p>Deaths: <b>${deaths}</b></p>
                <p>Mortality Rate: <b>${mortalityRate}%</b></p>
                ${countryFlagHTML}`;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            popup.setLngLat(coordinates).setHTML(HTML).addTo(map);
          }
        });

        map.on("mouseleave", "circles", function () {
          lastId = undefined;
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
      });
    }
  }, [data]);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* mapbox container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
