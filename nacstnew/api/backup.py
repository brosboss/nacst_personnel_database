# import frappe
# import subprocess
# import os
# from pathlib import Path


import frappe
import subprocess
from pathlib import Path
from datetime import datetime
import socket
import binascii
from frappe.utils import now_datetime

@frappe.whitelist()
def backup_to_qnap():
    if not _has_backup_role():
        frappe.throw("Not permitted")

    site = frappe.local.site

    bench_path = frappe.conf.get("bench_path")
    if not bench_path:
        raise frappe.ValidationError("bench_path is not set in site_config.json")

    # 1) Create backup
    subprocess.check_call([bench_path, "--site", site, "backup", "--with-files"])

    # 2) Find latest backup set in sites/<site>/private/backups
    backup_dir = Path(frappe.get_site_path("private", "backups")).resolve()
    if not backup_dir.exists():
        raise frappe.ValidationError(f"Backup folder not found: {backup_dir}")

    # Find latest timestamp prefix (e.g. 20260120_201953)
    prefixes = []
    for p in backup_dir.glob("*-database.sql.gz"):
        prefixes.append(p.name.split("-", 1)[0])

    if not prefixes:
        raise frappe.ValidationError(f"No backups found in: {backup_dir}")

    latest_prefix = sorted(prefixes)[-1]

    files = [
        f"{latest_prefix}-{site.replace('.', '_')}-database.sql.gz",
        f"{latest_prefix}-{site.replace('.', '_')}-files.tar",
        f"{latest_prefix}-{site.replace('.', '_')}-private-files.tar",
        f"{latest_prefix}-{site.replace('.', '_')}-site_config_backup.json",
    ]

    # Some sites may not generate files/private-files if --with-files is not used.
    # So filter to existing files only.
    files_to_send = [str((backup_dir / f).resolve()) for f in files if (backup_dir / f).exists()]

    if not files_to_send:
        raise frappe.ValidationError("Latest backup files were not found after backup ran")

    # 3) Prepare NAS destination
    nas_user = frappe.conf.qnap_user
    nas_host = frappe.conf.qnap_host
    nas_port = int(frappe.conf.get("qnap_port") or 22)
    nas_base = frappe.conf.get("qnap_base_path")
    if not nas_base:
        raise frappe.ValidationError("qnap_base_path is not set in site_config.json")

    # Generate folder name in format: 2_jan_25_2000hrs_frappe_user
    # where 2 = day of week (Monday=1, Tuesday=2, etc.)
    now = datetime.now()
    day_of_week = now.weekday() + 1  # Monday=1, Tuesday=2, ..., Sunday=7
    month_abbr = now.strftime("%b").lower()  # jan, feb, mar, etc.
    day_of_month = now.strftime("%d")  # 01-31
    time_str = now.strftime("%H%M") + "hrs"  # 2000hrs format
    frappe_username = frappe.session.user
    
    backup_folder_name = f"{day_of_week}_{month_abbr}_{day_of_month}_{time_str}_{frappe_username}"
    remote_backup_dir = f"{nas_base}/{site}/{backup_folder_name}"

    # Create remote folder first
    subprocess.check_call([
        "ssh",
        "-o", "StrictHostKeyChecking=accept-new",
        "-p", str(nas_port),
        f"{nas_user}@{nas_host}",
        f"mkdir -p '{remote_backup_dir}'"
    ])

    # Rsync only the latest backup files into that folder
    subprocess.check_call([
        "rsync",
        "-az",
        "-e", f"ssh -p {nas_port} -o StrictHostKeyChecking=accept-new",
        *files_to_send,
        f"{nas_user}@{nas_host}:{remote_backup_dir}/"
    ])

    # Record last backup time on the single doctype
    try:
        frappe.db.set_single_value("Backup to NAS", "last_backup_at", now_datetime())
    except Exception:
        # Don't block backup completion on this write
        pass

    return f"Backup sent to NAS: {backup_folder_name}"
    # # 3) Prepare NAS destination
    # nas_user = frappe.conf.qnap_user
    # nas_host = frappe.conf.qnap_host
    # nas_port = int(frappe.conf.get("qnap_port") or 22)
    # nas_base = frappe.conf.get("qnap_base_path")
    # if not nas_base:
    #     raise frappe.ValidationError("qnap_base_path is not set in site_config.json")

    # remote_site_dir = f"{nas_base}/{site}"

    # # Create remote folder first + accept host key automatically
    # subprocess.check_call([
    #     "ssh",
    #     "-o", "StrictHostKeyChecking=accept-new",
    #     "-p", str(nas_port),
    #     f"{nas_user}@{nas_host}",
    #     f"mkdir -p '{remote_site_dir}'"
    # ])

    # # 4) Rsync only the latest backup files
    # subprocess.check_call([
    #     "rsync",
    #     "-az",
    #     "-e", f"ssh -p {nas_port} -o StrictHostKeyChecking=accept-new",
    #     *files_to_send,
    #     f"{nas_user}@{nas_host}:{remote_site_dir}/"
    # 
@frappe.whitelist()
def list_nas_backups():
    if not _has_backup_role():
        frappe.throw("Not permitted")

    site = frappe.local.site

    nas_user = frappe.conf.qnap_user
    nas_host = frappe.conf.qnap_host
    nas_port = int(frappe.conf.get("qnap_port") or 22)
    nas_base = frappe.conf.get("qnap_base_path")

    if not nas_base:
        raise frappe.ValidationError("qnap_base_path is not set")

    remote_site_dir = f"{nas_base}/{site}"

    cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=accept-new",
        "-p", str(nas_port),
        f"{nas_user}@{nas_host}",
        f"ls -1 '{remote_site_dir}'"
    ]

    result = subprocess.check_output(cmd, text=True).strip()

    if not result:
        return []

    backups = sorted(result.splitlines(), reverse=True)
    return backups

@frappe.whitelist()
def check_nas_connection():
    """Check if NAS is reachable via SSH"""
    if not _has_backup_role():
        frappe.throw("Not permitted")
    
    try:
        nas_user = frappe.conf.qnap_user
        nas_host = frappe.conf.qnap_host
        nas_port = int(frappe.conf.get("qnap_port") or 22)
        
        if not nas_user or not nas_host:
            return {"connected": False, "message": "NAS configuration not set"}
        
        # Test SSH connection with a quick command
        cmd = [
            "ssh",
            "-o", "ConnectTimeout=5",
            "-o", "StrictHostKeyChecking=accept-new",
            "-o", "BatchMode=yes",
            "-p", str(nas_port),
            f"{nas_user}@{nas_host}",
            "echo 'connected'"
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            return {"connected": True, "message": "NAS is connected"}
        else:
            return {"connected": False, "message": "NAS connection failed"}
            
    except subprocess.TimeoutExpired:
        return {"connected": False, "message": "Connection timeout"}
    except Exception as e:
        return {"connected": False, "message": str(e)}


def _send_wol(mac: str, broadcast_ip: str = "192.168.88.255", port: int = 9):
    mac_clean = mac.replace(":", "").replace("-", "").lower()
    if len(mac_clean) != 12:
        raise ValueError("Invalid MAC address")

    mac_bytes = binascii.unhexlify(mac_clean)
    packet = b"\xff" * 6 + mac_bytes * 16

    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    s.sendto(packet, (broadcast_ip, port))
    s.close()

@frappe.whitelist()
def power_on_nas():
    if not _has_backup_role():
        frappe.throw("Not permitted")

    mac = frappe.conf.get("nas_mac")
    bcast = frappe.conf.get("nas_broadcast_ip", "192.168.88.255")
    port = int(frappe.conf.get("nas_wol_port") or 9)

    if not mac:
        frappe.throw("nas_mac is not set in site_config.json")

    _send_wol(mac, bcast, port)
    return "Wake-on-LAN packet sent"

import subprocess

@frappe.whitelist()
def power_off_nas():
    if not _has_backup_role():
        frappe.throw("Not permitted")

    nas_user = frappe.conf.get("nas_shutdown_user")
    nas_host = frappe.conf.get("qnap_host")
    nas_port = int(frappe.conf.get("qnap_port") or 22)

    if not nas_user or not nas_host:
        frappe.throw("qnap_user or qnap_host missing in site_config.json")

    # Try commands without sudo (since sudo is not present)
    shutdown_commands = [
        "/sbin/poweroff",
        "/bin/poweroff",
        "poweroff",
        "/sbin/shutdown -h now",
        "/bin/shutdown -h now",
        "shutdown -h now",
        "/sbin/halt",
        "/bin/halt",
        "halt",
    ]

    last_stderr = None

    for cmd_str in shutdown_commands:
        try:
            cmd = [
                "ssh",
                "-o", "StrictHostKeyChecking=accept-new",
                "-p", str(nas_port),
                f"{nas_user}@{nas_host}",
                cmd_str
            ]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                return "Shutdown command sent to NAS"

            if result.stderr:
                last_stderr = result.stderr.strip()

        except subprocess.TimeoutExpired:
            # Often means the NAS is already shutting down
            return "Shutdown command sent to NAS (system may be shutting down)"

    frappe.throw(
        f"Failed to shut down NAS. Last error: {last_stderr or 'unknown error'}. "
        "Use an admin-capable SSH user or enable the correct shutdown method on the NAS."
    )


def _has_backup_role():
    """Allow access to System Manager or Can Backup NAS role."""
    roles = frappe.get_roles()
    return ("System Manager" in roles) or ("Can Backup NAS" in roles)


# @frappe.whitelist()
# def backup_to_qnap():
    
#     site = "nacstnew.local"

#     bench_path = frappe.conf.get("bench_path")  # set this in site_config.json
#     if not bench_path:
#         raise frappe.ValidationError("bench_path is not set in site_config.json")

#     subprocess.check_call([bench_path, "--site", site, "backup", "--with-files"])

#     backup_dir = Path(frappe.get_site_path("private", "backups"))
#     # print("yes")
#     # return("yes")

#     # pass
#     qnap_user = frappe.conf.qnap_user
#     qnap_host = frappe.conf.qnap_host
#     qnap_port = int(frappe.conf.get("qnap_port") or 22)
#     qnap_path = f"/share/frappe_backups_ssh/{site}/"

#     rsync_cmd = [
#         "rsync",
#         "-az",
#         "-e", f"ssh -p {qnap_port}",
#         f"{backup_dir}/",
#         f"{qnap_user}@{qnap_host}:{qnap_path}"
#     ]
#     subprocess.check_call(rsync_cmd)

#     return "Backup completed and sent to QNAP successfully"


# @frappe.whitelist()
# def backup_to_qnap():
#     site = frappe.local.site

#     # Step 1: Run backup
#     subprocess.check_call([
#         "bench", "--site", site, "backup", "--with-files"
#     ])

#     # Step 2: Locate backup folder
#     backup_dir = Path(frappe.get_site_path("private", "backups"))

#     # Step 3: Rsync to QNAP
#     qnap_user = frappe.conf.qnap_user
#     qnap_host = frappe.conf.qnap_host
#     qnap_path = f"/share/frappe_backups_ssh/{site}/"

#     rsync_cmd = [
#         "rsync",
#         "-az",
#         "--progress",
#         f"{backup_dir}/",
#         f"{qnap_user}@{qnap_host}:{qnap_path}"
#     ]

#     subprocess.check_call(rsync_cmd)

#     return "Backup completed and sent to QNAP successfully"
