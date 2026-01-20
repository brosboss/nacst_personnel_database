// Copyright (c) 2026, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("Backup to NAS", {

    refresh(frm) {
        frm.add_custom_button('Backup to NAS', () => {
            frappe.call({                 
                method: 'nacstnew.api.backup.backup_to_qnap',
                freeze: true,
                freeze_message: 'Backing up to QNAP...',
                callback: r => {
                    frappe.msgprint(r.message);
                }
            });
        });

        frm.add_custom_button("View NAS Backups", () => {
            frappe.call({
                method: "nacstnew.api.backup.list_nas_backups",
                callback(r) {
                    if (!r.message || !r.message.length) {
                        frappe.msgprint("No backups found on NAS");
                        return;
                    }
        
                    frappe.msgprint({
                        title: "Backups on NAS",
                        message: "<ul>" + r.message.map(b => `<li>${b}</li>`).join("") + "</ul",
                        indicator: "blue"
                    });
                }
            });
        });
    }
});
