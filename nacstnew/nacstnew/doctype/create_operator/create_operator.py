# Copyright (c) 2025, !! and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CreateOperator(Document):
	def validate(self):
		"""Validate before saving"""
		# Validate email format
		if self.email:
			frappe.utils.validate_email_address(self.email, throw=True)
		
		# Only check if user exists when creating a new document
		# If updating, the user might have been created by this document
		if self.is_new() and frappe.db.exists("User", self.email):
			frappe.throw(f"User with email {self.email} already exists")
	
	def after_insert(self):
		"""Create user after document is inserted"""
		self.create_user()
	
	def on_update(self):
		"""Update user when Create Operator document is updated"""
		self.update_user()
	
	def create_user(self):
		"""Create a new User based on the Create Operator document"""
		try:
			# Check if user already exists
			if frappe.db.exists("User", self.email):
				frappe.msgprint(f"User with email {self.email} already exists. Skipping user creation.", indicator="orange")
				return
			
			# Create new user
			user = frappe.new_doc("User")
			user.update({
				"name": self.email,
				"email": self.email,
				"first_name": self.first_name,
				"enabled": 1,
				"user_type": "System User",
				"send_welcome_email": 0,  # Don't send welcome email automatically
			})
			
			# Set module profile if provided
			if self.module_profile and self.module_profile != "No Module":
				user.module_profile = self.module_profile
			
			# Set password using new_password field (recommended approach)
			if self.password:
				user.new_password = self.password
				# Ignore password policy if needed (optional, remove if you want to enforce policy)
				user.flags.ignore_password_policy = True
			
			# Insert user
			user.insert(ignore_permissions=True)
			
			# Add roles from app_roles_assigned_list
			roles_to_add = []
			if self.app_roles_assigned_list:
				for role_row in self.app_roles_assigned_list:
					if role_row.app_role:
						# Get the actual role name from App Role List
						# role_row.app_role is the name of App Role List document
						# We need to get the app_role field from that document which links to Role
						role_name = frappe.db.get_value("App Role List", role_row.app_role, "app_role")
						if role_name:
							roles_to_add.append(role_name)
			
			# Add roles to user
			if roles_to_add:
				user.add_roles(*roles_to_add)
			
			# Reload user to ensure all changes are committed
			user.reload()
			
			frappe.msgprint(f"User {self.email} created successfully", indicator="green")
			
		except Exception as e:
			frappe.log_error(f"Error creating user: {str(e)}", "Create Operator Error")
			frappe.throw(f"Failed to create user: {str(e)}")
	
	def update_user(self):
		"""Update existing User based on Create Operator document changes"""
		try:
			# Check if user exists
			if not frappe.db.exists("User", self.email):
				frappe.msgprint(f"User with email {self.email} does not exist. Cannot update.", indicator="orange")
				return
			
			# Get the user document
			user = frappe.get_doc("User", self.email)
			has_changes = False
			
			# Update basic fields if changed
			if self.has_value_changed("first_name"):
				user.first_name = self.first_name
				has_changes = True
			
			if self.has_value_changed("module_profile"):
				if self.module_profile and self.module_profile != "No Module":
					user.module_profile = self.module_profile
				else:
					user.module_profile = None
				has_changes = True
			
			# Update password if changed
			if self.has_value_changed("password") and self.password:
				user.new_password = self.password
				user.flags.ignore_password_policy = True
				has_changes = True
			
			# Update roles if app_roles_assigned_list changed
			roles_updated = False
			if self.has_value_changed("app_roles_assigned_list"):
				# Get current roles from user
				current_roles = set([d.role for d in user.get("roles")])
				
				# Get new roles from app_roles_assigned_list
				new_roles = set()
				if self.app_roles_assigned_list:
					for role_row in self.app_roles_assigned_list:
						if role_row.app_role:
							role_name = frappe.db.get_value("App Role List", role_row.app_role, "app_role")
							if role_name:
								new_roles.add(role_name)
				
				# Find roles to add and remove
				roles_to_add = new_roles - current_roles
				roles_to_remove = current_roles - new_roles
				
				# Update roles manually without saving (to avoid multiple saves)
				# Remove old roles
				if roles_to_remove:
					existing_roles = {d.role: d for d in user.get("roles")}
					for role in roles_to_remove:
						if role in existing_roles:
							user.get("roles").remove(existing_roles[role])
					roles_updated = True
				
				# Add new roles using append_roles (doesn't save)
				if roles_to_add:
					user.append_roles(*roles_to_add)
					roles_updated = True
			
			# Save user if any changes were made (fields, password, or roles)
			if has_changes or roles_updated:
				user.save(ignore_permissions=True)
				frappe.msgprint(f"User {self.email} updated successfully", indicator="green")
			
		except Exception as e:
			frappe.log_error(f"Error updating user: {str(e)}", "Create Operator Error")
			frappe.throw(f"Failed to update user: {str(e)}")
