// Copyright (c) 2025, !! and contributors
// For license information, please see license.txt

/**
 * Reusable Navigation Sidebar Component
 * Usage: 
 *   let sidebarHtml = getNavigationSidebar('personnel-list');
 *   let sidebarCss = getNavigationSidebarCSS();
 */

// Navigation menu items configuration
// Use window.NAVIGATION_ITEMS to avoid redeclaration errors when scripts reload
if (typeof window.NAVIGATION_ITEMS === 'undefined') {
	window.NAVIGATION_ITEMS = [
		{
			route: 'personnel-record',
			label: 'Personnel Record',
			icon: 'fa-user'
		},
		{
			route: 'personnel-list',
			label: 'Personnel List',
			icon: 'fa-list'
		},
		{
			route: 'personnel-view',
			label: 'Personnel View',
			icon: 'fa-id-card'
		},
		{
			route: 'units-view',
			label: 'Units View',
			icon: 'fa-building'
		},
		{
			route: '#',
			label: 'Reports',
			icon: 'fa-chart-line'
		},
		{
			route: '#',
			label: 'Documents',
			icon: 'fa-file-alt'
		},
		{
			route: '#',
			label: 'Settings',
			icon: 'fa-cog'
		}
	];
}

/**
 * Get the CSS for the navigation sidebar with page-specific prefix
 * @param {string} pagePrefix - Page-specific prefix (e.g., 'pl' for personnel-list)
 * @returns {string} CSS styles as a string
 */
function getNavigationSidebarCSS(pagePrefix) {
	const prefix = pagePrefix || 'nav';
	const styleId = `navigation-sidebar-css-${prefix}`;
	
	if (document.getElementById(styleId)) {
		return ''; // CSS already injected for this page
	}
	
	const style = document.createElement('style');
	style.id = styleId;
	style.textContent = `
		.${prefix}-nav-sidebar {
			width: 250px;
			background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
			border-radius: 12px;
			padding: 20px;
			box-shadow: 0 4px 20px rgba(0,0,0,0.3);
			overflow-y: auto;
			flex-shrink: 0;
		}
		
		.${prefix}-nav-sidebar-title {
			color: #fff;
			font-size: 18px;
			font-weight: 700;
			margin-bottom: 30px;
			padding-bottom: 15px;
			border-bottom: 2px solid rgba(255,255,255,0.1);
		}
		
		.${prefix}-nav-sidebar .${prefix}-nav-item {
			display: block;
			padding: 12px 15px;
			margin-bottom: 8px;
			color: rgba(255,255,255,0.8);
			text-decoration: none;
			border-radius: 8px;
			transition: all 0.3s ease;
			cursor: pointer;
			border-left: 3px solid transparent;
		}
		
		.${prefix}-nav-sidebar .${prefix}-nav-item:hover {
			background: rgba(255,255,255,0.1);
			color: #fff;
			border-left-color: #667eea;
			transform: translateX(5px);
		}
		
		.${prefix}-nav-sidebar .${prefix}-nav-item.active {
			background: rgba(102, 126, 234, 0.2);
			color: #fff;
			border-left-color: #667eea;
		}
		
		.${prefix}-nav-sidebar .${prefix}-nav-item i {
			margin-right: 10px;
			width: 20px;
		}
		
		/* Scrollbar styling for sidebar */
		.${prefix}-nav-sidebar::-webkit-scrollbar {
			width: 6px;
		}
		
		.${prefix}-nav-sidebar::-webkit-scrollbar-track {
			background: rgba(255,255,255,0.1);
			border-radius: 10px;
		}
		
		.${prefix}-nav-sidebar::-webkit-scrollbar-thumb {
			background: rgba(255,255,255,0.3);
			border-radius: 10px;
		}
		
		.${prefix}-nav-sidebar::-webkit-scrollbar-thumb:hover {
			background: rgba(255,255,255,0.5);
		}
	`;
	document.head.appendChild(style);
	return ''; // Return empty string since CSS is injected directly
}

/**
 * Get the HTML for the navigation sidebar with page-specific prefix
 * @param {string} activeRoute - The route name of the currently active page (e.g., 'personnel-list')
 * @param {string} pagePrefix - Page-specific prefix (e.g., 'pl' for personnel-list)
 * @returns {string} HTML string for the sidebar
 */
function getNavigationSidebar(activeRoute, pagePrefix) {
	const prefix = pagePrefix || 'nav';
	
	// Inject CSS for this page
	getNavigationSidebarCSS(prefix);
	
	let html = `
		<div class="${prefix}-nav-sidebar">
			<div class="${prefix}-nav-sidebar-title">
				<i class="fa fa-bars"></i> NACST
			</div>
	`;
	
	window.NAVIGATION_ITEMS.forEach(function(item) {
		const isActive = item.route === activeRoute;
		const activeClass = isActive ? 'active' : '';
		const onClick = item.route === '#' 
			? '' 
			: `onclick="frappe.set_route('${item.route}'); return false;"`;
		
		html += `
			<a href="#" class="${prefix}-nav-item ${activeClass}" ${onClick}>
				<i class="fa ${item.icon}"></i> ${item.label}
			</a>
		`;
	});
	
	html += `</div>`;
	return html;
}

/**
 * Inject CSS to hide Frappe's default sidebar for a specific page (only once per page)
 * @param {string} pageName - The page name (e.g., 'personnel-list')
 * @returns {string} Empty string (CSS is injected directly)
 */
function hideDefaultSidebarCSS(pageName) {
	const styleId = `hide-default-sidebar-${pageName}`;
	if (document.getElementById(styleId)) {
		return ''; // CSS already injected for this page
	}
	
	const style = document.createElement('style');
	style.id = styleId;
	style.textContent = `
		body[data-page-name="${pageName}"] .form-sidebar,
		body[data-page-name="${pageName}"] .list-sidebar,
		body[data-page-name="${pageName}"] .desk-sidebar {
			display: none !important;
		}
		
		body[data-page-name="${pageName}"] .layout-main-section {
			width: 100% !important;
			margin-left: 0 !important;
		}
		
		body[data-page-name="${pageName}"] .page-content {
			width: 100% !important;
			padding: 0 !important;
		}
	`;
	document.head.appendChild(style);
	return ''; // Return empty string since CSS is injected directly
}

