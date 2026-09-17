"""Discover BLE devices or inspect a selected device, without proprietary writes."""
import argparse
import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from bleak import BleakClient, BleakScanner

INFO = {
    "00002a24-0000-1000-8000-00805f9b34fb": "model",
    "00002a26-0000-1000-8000-00805f9b34fb": "firmware",
    "00002a27-0000-1000-8000-00805f9b34fb": "hardware",
    "00002a29-0000-1000-8000-00805f9b34fb": "manufacturer",
}


async def probe(args):
    report = {"time_utc": datetime.now(timezone.utc).isoformat(),
              "mode": "inspect" if args.address else "scan", "devices": []}
    try:
        discovered = await BleakScanner.discover(timeout=args.seconds, return_adv=True)
        report["devices"] = [
            {"address": d.address, "name": a.local_name or d.name,
             "rssi": a.rssi, "services": a.service_uuids}
            for d, a in discovered.values()
        ]
        if args.address:
            device = next((d for d, _ in discovered.values()
                           if d.address.lower() == args.address.lower()), None)
            if device is None:
                raise RuntimeError("El dispositivo seleccionado no anuncia BLE; acércalo y vuelve a probar.")
            async with BleakClient(device, timeout=20) as client:
                report["services"] = []
                for service in client.services:
                    entry = {"uuid": service.uuid, "characteristics": []}
                    for char in service.characteristics:
                        item = {"uuid": char.uuid, "properties": char.properties}
                        if char.uuid in INFO and "read" in char.properties:
                            try:
                                item[INFO[char.uuid]] = (await client.read_gatt_char(char)).decode("utf-8", errors="replace")
                            except Exception as error:
                                item["read_error"] = str(error)
                        entry["characteristics"].append(item)
                    report["services"].append(entry)
    except Exception as error:
        report["error"] = f"{type(error).__name__}: {error}"
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    for device in report["devices"]:
        print(f"{device['address']}  {device['name'] or '(sin nombre)'}  {device['rssi']} dBm")
    print(f"Informe local: {output}")
    if "error" in report:
        print(report["error"])
        return 1
    if not report["devices"]:
        print("Sin anuncios BLE. No demuestra ausencia de reloj ni de sensores.")
    return 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--address", help="Dirección exacta del reloj, obtenida con el escaneo")
    parser.add_argument("--seconds", type=float, default=12)
    parser.add_argument("--output", default="captures/ble-probe.json")
    args = parser.parse_args()
    if not 0 < args.seconds <= 60:
        parser.error("--seconds debe estar entre 0 y 60")
    raise SystemExit(asyncio.run(probe(args)))
