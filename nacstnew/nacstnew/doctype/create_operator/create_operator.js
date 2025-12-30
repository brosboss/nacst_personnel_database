// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

frappe.ui.form.on("Create Operator", {
	refresh(frm) {
		// Add custom button to check if user exists
		if (!frm.is_new()) {
			frm.add_custom_button(__("Check User"), function() {
				frappe.call({
					method: "frappe.client.get",
					args: {
						doctype: "User",
						name: frm.doc.email
					},
					callback: function(r) {
						if (r.message) {
							frappe.show_alert({
								message: __("User already exists"),
								indicator: "orange"
							});
						} else {
							frappe.show_alert({
								message: __("User does not exist"),
								indicator: "green"
							});
						}
					},
					error: function() {
						frappe.show_alert({
							message: __("User does not exist"),
							indicator: "green"
						});
					}
				});
			});
		}
		
		// Populate roles HTML with checkboxes
		frm.trigger("populate_roles_html");
		
		// Sync child table with checkboxes after a short delay to ensure HTML is rendered
		setTimeout(function() {
			frm.trigger("sync_child_table_with_checkboxes");
		}, 500);
	},
	
	populate_roles_html(frm) {
		// Fetch all App Role List records with owner_doctype
		frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: "App Role List",
				fields: ["name", "owner_doctype", "app_role"],
				order_by: "owner_doctype asc, name asc",
				limit_page_length: 1000  // Get all records (default is 20)
			},
			callback: function(r) {
				console.log("App Role List response:", r);
				
				if (r.message && r.message.length > 0) {
					// Get currently assigned roles
					let assigned_roles = [];
					if (frm.doc.app_roles_assigned_list) {
						assigned_roles = frm.doc.app_roles_assigned_list.map(row => row.app_role);
					}
					
					// Group roles by owner_doctype
					let grouped_roles = {};
					r.message.forEach(function(role) {
						let doctype = role.owner_doctype || 'Other';
						if (!grouped_roles[doctype]) {
							grouped_roles[doctype] = [];
						}
						grouped_roles[doctype].push(role);
					});
					
					// Create HTML with grouped checkboxes in columns
					let html = `
						<div class="roles-checklist" style="
							max-height: 550px; 
							overflow-y: auto; 
							padding: 20px; 
							border: 1px solid #d1d8dd; 
							border-radius: 6px; 
							background: #ffffff;
							box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
						">
					`;
					
					// Sort doctypes for consistent display
					let sorted_doctypes = Object.keys(grouped_roles).sort();
					
					if (sorted_doctypes.length === 0) {
						html += `
							<div style="
								padding: 40px 20px; 
								text-align: center; 
								color: #8d99a6;
								background: #f8f9fa;
								border-radius: 4px;
							">
								<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">No roles found in App Role List</p>
								<p style="margin: 0; font-size: 12px; color: #6c757d;">Please run the role creation script first.</p>
							</div>
						`;
					} else {
						// Create table-like layout with aligned headers
						sorted_doctypes.forEach(function(doctype, doctypeIndex) {
							let roles = grouped_roles[doctype];
							
							// Create header - spans full width
							html += `
								<div style="
									margin-top: ${doctypeIndex === 0 ? '0' : '25px'};
									margin-bottom: 12px;
									padding: 10px 12px;
									background: linear-gradient(to right, #f8f9fa, #ffffff);
									border-left: 4px solid #007bff;
									border-bottom: 1px solid #dee2e6;
									border-radius: 3px;
									width: 100%;
								">
									<strong style="
										font-size: 13px; 
										color: #212529; 
										font-weight: 600;
										letter-spacing: 0.3px;
										text-transform: uppercase;
									">${frappe.utils.escape_html(doctype)}</strong>
								</div>
							`;
							
							// Create 4-column flex container for roles
							html += `
								<div style="
									display: flex;
									gap: 20px;
									margin-bottom: 15px;
								">
							`;
							
							// Distribute roles across 4 columns (round-robin)
							let columns = [[], [], [], []];
							roles.forEach(function(role, index) {
								columns[index % 4].push(role);
							});
							
							// Render each column as a flex column
							for (let colIndex = 0; colIndex < 4; colIndex++) {
								html += `<div style="flex: 1; min-width: 0;">`;
								
								columns[colIndex].forEach(function(role) {
									let checked = assigned_roles.includes(role.name) ? 'checked' : '';
									let role_display = role.app_role || role.name;
									
									html += `
										<div class="checkbox role-item" style="
											margin: 6px 0;
											padding: 6px 8px;
											border-radius: 4px;
											transition: background-color 0.2s ease;
										" onmouseover="this.style.backgroundColor='#f8f9fa'" onmouseout="this.style.backgroundColor='transparent'">
											<label style="
												cursor: pointer; 
												font-weight: normal; 
												display: flex; 
												align-items: center; 
												font-size: 13px;
												color: #495057;
												margin: 0;
											">
												<input type="checkbox" class="role-checkbox" 
													data-role-name="${frappe.utils.escape_html(role.name)}" 
													${checked} 
													style="
														margin-right: 10px; 
														margin-top: 0; 
														cursor: pointer;
														width: 16px;
														height: 16px;
														accent-color: #007bff;
													">
												<span style="
													flex: 1;
													line-height: 1.5;
												">${frappe.utils.escape_html(role_display)}</span>
											</label>
										</div>
									`;
								});
								
								html += `</div>`; // Close column
							}
							
							html += '</div>'; // Close flex container for this doctype
						});
					}
					
					html += '</div>';
					
					// Set HTML content
					if (frm.fields_dict.roles_html) {
						frm.fields_dict.roles_html.$wrapper.html(html);
						
						// Sync child table with checkboxes on initial load
						frm.trigger("sync_child_table_with_checkboxes");
						
						// Bind checkbox change events
						frm.fields_dict.roles_html.$wrapper.find('.role-checkbox').on('change', function() {
							let $checkbox = $(this);
							let role_name = $checkbox.data('role-name');
							let is_checked = $checkbox.is(':checked');
							
							if (is_checked) {
								// Add role to child table if it doesn't exist
								let exists = false;
								if (frm.doc.app_roles_assigned_list) {
									exists = frm.doc.app_roles_assigned_list.some(row => row.app_role === role_name);
								}
								
								if (!exists) {
									let child_row = frm.add_child('app_roles_assigned_list');
									child_row.app_role = role_name;
									frm.refresh_field('app_roles_assigned_list');
								}
							} else {
								// Remove role from child table
								if (frm.doc.app_roles_assigned_list) {
									let row_to_remove = frm.doc.app_roles_assigned_list.find(row => row.app_role === role_name);
									if (row_to_remove) {
										frappe.model.clear_doc(row_to_remove.doctype, row_to_remove.name);
										frm.refresh_field('app_roles_assigned_list');
									}
								}
							}
							frm.dirty();
						});
					} else {
						console.error("roles_html field not found");
					}
				} else {
					// No roles found
					let html = `
						<div class="roles-checklist" style="
							max-height: 400px; 
							overflow-y: auto; 
							padding: 30px 20px; 
							border: 1px solid #d1d8dd; 
							border-radius: 6px; 
							text-align: center; 
							background: #ffffff;
							box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
						">
							<div style="
								padding: 30px;
								background: #f8f9fa;
								border-radius: 4px;
								border: 1px dashed #dee2e6;
							">
								<p style="
									margin: 0 0 15px 0; 
									font-size: 15px; 
									font-weight: 500;
									color: #495057;
								">No roles found in App Role List</p>
								<p style="
									font-size: 13px; 
									margin: 0 0 20px 0;
									color: #6c757d;
								">Please run the following command to create roles:</p>
								<code style="
									font-size: 12px; 
									font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
									background: #ffffff; 
									padding: 12px 16px; 
									border-radius: 4px; 
									border: 1px solid #dee2e6;
									display: inline-block;
									color: #212529;
									box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
								">bench --site [site-name] execute nacstnew.nacstnew.nacstnew.utils.create_personnel_roles.add_all_roles_to_app_role_list</code>
							</div>
						</div>
					`;
					
					if (frm.fields_dict.roles_html) {
						frm.fields_dict.roles_html.$wrapper.html(html);
					}
				}
			},
			error: function(r) {
				console.error("Error fetching App Role List:", r);
				let html = `
					<div class="roles-checklist" style="
						max-height: 400px; 
						overflow-y: auto; 
						padding: 30px 20px; 
						border: 1px solid #f5c6cb; 
						border-radius: 6px; 
						text-align: center; 
						background: #fff5f5;
						box-shadow: 0 1px 3px rgba(220, 53, 69, 0.1);
					">
						<div style="
							padding: 20px;
							background: #ffffff;
							border-radius: 4px;
							border: 1px solid #f5c6cb;
						">
							<p style="
								margin: 0; 
								font-size: 14px; 
								font-weight: 500;
								color: #dc3545;
							">⚠ Error loading roles</p>
							<p style="
								margin: 10px 0 0 0;
								font-size: 12px;
								color: #721c24;
							">Please check the console for details.</p>
						</div>
					</div>
				`;
				
				if (frm.fields_dict.roles_html) {
					frm.fields_dict.roles_html.$wrapper.html(html);
				}
			}
		});
	},
	
	sync_child_table_with_checkboxes(frm) {
		// Ensure child table matches checked roles in HTML
		if (!frm.fields_dict.roles_html || !frm.fields_dict.roles_html.$wrapper) {
			return;
		}
		
		// Get all checked roles from HTML
		let checked_roles = [];
		frm.fields_dict.roles_html.$wrapper.find('.role-checkbox:checked').each(function() {
			checked_roles.push($(this).data('role-name'));
		});
		
		// Get current roles in child table
		let current_child_roles = [];
		if (frm.doc.app_roles_assigned_list) {
			current_child_roles = frm.doc.app_roles_assigned_list.map(row => row.app_role);
		}
		
		// Add missing roles to child table
		checked_roles.forEach(function(role_name) {
			if (!current_child_roles.includes(role_name)) {
				let child_row = frm.add_child('app_roles_assigned_list');
				child_row.app_role = role_name;
			}
		});
		
		// Remove unchecked roles from child table
		if (frm.doc.app_roles_assigned_list) {
			let rows_to_remove = [];
			frm.doc.app_roles_assigned_list.forEach(function(row) {
				if (!checked_roles.includes(row.app_role)) {
					rows_to_remove.push(row);
				}
			});
			
			rows_to_remove.forEach(function(row) {
				frappe.model.clear_doc(row.doctype, row.name);
			});
		}
		
		// Refresh if changes were made
		if (checked_roles.length !== current_child_roles.length || 
			checked_roles.some(role => !current_child_roles.includes(role))) {
			frm.refresh_field('app_roles_assigned_list');
		}
	},
	
	app_roles_assigned_list(frm) {
		// Update checkbox states when child table changes (bidirectional sync)
		if (frm.fields_dict.roles_html && frm.fields_dict.roles_html.$wrapper) {
			let assigned_roles = [];
			if (frm.doc.app_roles_assigned_list) {
				assigned_roles = frm.doc.app_roles_assigned_list.map(row => row.app_role);
			}
			
			// Update checkbox states to match child table
			frm.fields_dict.roles_html.$wrapper.find('.role-checkbox').each(function() {
				let $checkbox = $(this);
				let role_name = $checkbox.data('role-name');
				let should_be_checked = assigned_roles.includes(role_name);
				
				// Only update if state is different to avoid infinite loops
				if ($checkbox.is(':checked') !== should_be_checked) {
					$checkbox.prop('checked', should_be_checked);
				}
			});
		}
	},
	
	email(frm) {
		// Validate email format
		if (frm.doc.email && !frappe.utils.validate_email(frm.doc.email)) {
			frappe.msgprint(__("Please enter a valid email address"));
			frm.set_value("email", "");
		}
	},
	
	validate(frm) {
		// Ensure email is provided
		if (!frm.doc.email) {
			frappe.msgprint(__("Email is required"));
			frappe.validated = false;
		}
		
		// Ensure first name is provided
		if (!frm.doc.first_name) {
			frappe.msgprint(__("First Name is required"));
			frappe.validated = false;
		}
	}
});
