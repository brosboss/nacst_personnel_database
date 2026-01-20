# import frappe
# import subprocess
# import os
# from pathlib import Path


import frappe
import subprocess
from pathlib import Path

@frappe.whitelist()
def backup_to_qnap():
    if not frappe.has_permission("System Settings", "write"):
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

    remote_backup_dir = f"{nas_base}/{site}/{latest_prefix}"

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
    # ])

    return f"Backup sent to NAS: {latest_prefix}"

@frappe.whitelist()
def list_nas_backups():
    if not frappe.has_permission("System Settings", "read"):
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
