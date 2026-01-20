// Copyright (c) 2026, !! and contributors
// For license information, please see license.txt

function set_html_content(frm, htmlContent) {
    // Try multiple methods to ensure HTML is set
    if (frm.fields_dict.nas_html) {
        // Method 1: Direct field control
        frm.fields_dict.nas_html.set_value(htmlContent);
    } else {
        // Method 2: Using set_value
        frm.set_value("nas_html", htmlContent).then(() => {
            frm.refresh_field("nas_html");
        });
    }
    
    // Method 3: Direct DOM manipulation as fallback
    setTimeout(() => {
        const field_wrapper = $(frm.wrapper).find('[data-fieldname="nas_html"]');
        if (field_wrapper.length) {
            const html_wrapper = field_wrapper.find('.control-value-wrapper, .html-control');
            if (html_wrapper.length) {
                html_wrapper.html(htmlContent);
            } else {
                field_wrapper.find('.control-input-wrapper').html(htmlContent);
            }
        }
    }, 100);
}

function generate_html_content(isConnected) {
    const statusIcon = isConnected 
        ? '<i class="fa fa-circle" style="color: green; font-size: 16px; margin-right: 5px;" title="NAS Connected"></i>'
        : '<i class="fa fa-circle" style="color: red; font-size: 16px; margin-right: 5px;" title="NAS Disconnected"></i>';
    const statusText = isConnected ? "NAS Connected" : "NAS Disconnected";
    
    return `
        <div style="padding: 15px; border: 1px solid #d1d8dd; border-radius: 4px; background: #fafbfc;">
            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                ${statusIcon}
                <span style="font-weight: 500; font-size: 14px;">${statusText}</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary btn-sm backup-nas-btn" style="flex: 1;">
                    <i class="fa fa-upload"></i> Backup to NAS
                </button>
                <button class="btn btn-default btn-sm view-nas-backups-btn" style="flex: 1;">
                    <i class="fa fa-list"></i> View NAS Backups
                </button>
            </div>
        </div>
    `;
}

function check_and_update_connection_status(frm, callback) {
    frappe.call({
        method: "nacstnew.api.backup.check_nas_connection",
        callback: (r) => {
            if (r.exc) {
                console.error("Error checking NAS connection:", r.exc);
                const isConnected = false;
                set_html_content(frm, generate_html_content(isConnected));
                if (callback) callback(isConnected);
                return;
            }
            
            const isConnected = r.message?.connected || false;
            set_html_content(frm, generate_html_content(isConnected));
            
            // Reattach event handlers after updating HTML
            setTimeout(() => {
                attach_event_handlers(frm);
            }, 200);
            
            if (callback) callback(isConnected);
        },
        error: (r) => {
            console.error("Error checking NAS connection:", r);
            const isConnected = false;
            set_html_content(frm, generate_html_content(isConnected));
            setTimeout(() => {
                attach_event_handlers(frm);
            }, 200);
            if (callback) callback(isConnected);
        }
    });
}

function attach_event_handlers(frm) {
    // Use event delegation on the form wrapper for reliable event handling
    $(frm.wrapper).off('click', '.backup-nas-btn').on('click', '.backup-nas-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // First check NAS connection before proceeding with backup
        frappe.call({
            method: "nacstnew.api.backup.check_nas_connection",
            freeze: true,
            freeze_message: 'Checking NAS connection...',
            callback: (r) => {
                const isConnected = r.message?.connected || false;
                
                // Update the status icon immediately
                set_html_content(frm, generate_html_content(isConnected));
                setTimeout(() => {
                    attach_event_handlers(frm);
                }, 100);
                
                if (!isConnected) {
                    // Notify user that NAS is not connected
                    frappe.msgprint({
                        title: "NAS Not Connected",
                        message: "Cannot backup to NAS. Please check your NAS connection and try again.",
                        indicator: "red"
                    });
                    return;
                }
                
                // NAS is connected, proceed with backup
                frappe.call({
                    method: 'nacstnew.api.backup.backup_to_qnap',
                    freeze: true,
                    freeze_message: 'Backing up to QNAP...',
                    callback: (r) => {
                        frappe.msgprint(r.message);
                        // Refresh connection status after backup
                        check_and_update_connection_status(frm);
                    },
                    error: (r) => {
                        // Refresh connection status on error
                        check_and_update_connection_status(frm);
                    }
                });
            },
            error: (r) => {
                // Connection check failed, assume disconnected
                const isConnected = false;
                set_html_content(frm, generate_html_content(isConnected));
                setTimeout(() => {
                    attach_event_handlers(frm);
                }, 100);
                
                frappe.msgprint({
                    title: "Connection Check Failed",
                    message: "Unable to check NAS connection. Please verify your NAS settings and try again.",
                    indicator: "red"
                });
            }
        });
    });
    
    $(frm.wrapper).off('click', '.view-nas-backups-btn').on('click', '.view-nas-backups-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        frappe.call({
            method: "nacstnew.api.backup.list_nas_backups",
            callback: (r) => {
                if (!r.message || !r.message.length) {
                    frappe.msgprint("No backups found on NAS");
                    return;
                }
        
                frappe.msgprint({
                    title: "Backups on NAS",
                    message: "<ul>" + r.message.map(b => `<li>${b}</li>`).join("") + "</ul>",
                    indicator: "blue"
                });
            }
        });
    });
}

function update_nas_html_field(frm) {
    // Check NAS connection status and update HTML field
    check_and_update_connection_status(frm, () => {
        // Wait a bit for the field to render, then attach event handlers
        setTimeout(() => {
            attach_event_handlers(frm);
        }, 300);
    });
}

frappe.ui.form.on("Backup to NAS", {
    onload(frm) {
        update_nas_html_field(frm);
    },
    
    refresh(frm) {
        update_nas_html_field(frm);
    }
});
