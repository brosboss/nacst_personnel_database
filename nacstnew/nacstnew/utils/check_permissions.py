"""Script to check and verify permissions for Personnel Category doctype"""
import frappe

@frappe.whitelist()
def check_personnel_category_permissions():
    """Check permissions for Personnel Category doctype"""
    doctype = "Personnel Category"
    role = "Personnel Creator"
    
    # Get the doctype
    doc = frappe.get_doc("DocType", doctype)
    
    # Check permissions
    permissions = doc.get("permissions", [])
    
    result = {
        "doctype": doctype,
        "role": role,
        "permissions_found": [],
        "has_read": False,
        "user_check": {}
    }
    
    # Check if role has read permission
    for perm in permissions:
        if perm.role == role:
            result["permissions_found"].append({
                "role": perm.role,
                "read": perm.read,
                "write": perm.write,
                "create": perm.create,
                "permlevel": perm.permlevel if hasattr(perm, 'permlevel') else 0
            })
            if perm.read:
                result["has_read"] = True
    
    # Check for a specific user
    test_user = "cc@c.com"
    if frappe.db.exists("User", test_user):
        user_roles = frappe.get_roles(test_user)
        result["user_check"] = {
            "user": test_user,
            "has_role": role in user_roles,
            "all_roles": user_roles,
            "can_read": frappe.has_permission(doctype, "read", user=test_user)
        }
    
    return result

@frappe.whitelist()
def clear_permissions_cache_for_doctype(doctype="Personnel Category"):
    """Clear cache for a specific doctype"""
    frappe.clear_cache(doctype=doctype)
    frappe.clear_cache(user="cc@c.com")
    return f"Cache cleared for {doctype} and user cc@c.com"

@frappe.whitelist()
def fix_personnel_category_permissions():
    """Explicitly add and save permissions for Personnel Category"""
    doctype = "Personnel Category"
    role = "Personnel Creator"
    
    # Get the doctype
    doc = frappe.get_doc("DocType", doctype)
    
    # Check if permission exists
    permission_exists = False
    for perm in doc.get("permissions", []):
        if perm.role == role:
            permission_exists = True
            # Ensure read is set
            if not perm.read:
                perm.read = 1
            break
    
    # If permission doesn't exist, add it
    if not permission_exists:
        doc.append("permissions", {
            "role": role,
            "read": 1,
            "write": 1,
            "email": 1,
            "export": 1,
            "print": 1,
            "report": 1,
            "share": 1
        })
    
    # Save the doctype
    doc.save(ignore_permissions=True)
    
    # Clear cache
    frappe.clear_cache(doctype=doctype)
    frappe.clear_cache()
    
    return {
        "status": "success",
        "message": f"Permissions updated for {doctype} - {role}",
        "permission_exists": permission_exists
    }

