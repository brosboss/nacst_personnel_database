frappe.pages['postings-with-pengin'].on_page_load = function (wrapper) {
	// Create page
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: __('Pending Part 2 Order'),
		single_column: true,
	});

	wrapper.page = page;

	page.body.html(
		'<div class="pending-part2-wrapper">' +
			'<div class="pending-part2-filters mb-3">' +
				'<div class="form-row">' +
					'<div class="col-md-3 mb-2">' +
						'<label class="control-label">' + __('Year') + '</label>' +
						'<select class="form-control" id="pp_year"></select>' +
					'</div>' +
					'<div class="col-md-3 mb-2">' +
						'<label class="control-label">' + __('Posted To Unit') + '</label>' +
						'<select class="form-control" id="pp_to_unit"></select>' +
					'</div>' +
					'<div class="col-md-3 mb-2">' +
						'<label class="control-label">' + __('From Date (WEF)') + '</label>' +
						'<input type="date" class="form-control" id="pp_from_date" />' +
					'</div>' +
					'<div class="col-md-3 mb-2">' +
						'<label class="control-label">' + __('To Date (WEF)') + '</label>' +
						'<input type="date" class="form-control" id="pp_to_date" />' +
					'</div>' +
				'</div>' +
				'<div class="mt-1">' +
					'<button class="btn btn-sm btn-primary" id="pp_refresh">' + __('Refresh') + '</button> ' +
					'<button class="btn btn-sm btn-default" id="pp_clear">' + __('Clear Filters') + '</button>' +
				'</div>' +
			'</div>' +
			'<div id="pending-part2-summary" class="mb-3"></div>' +
			'<div id="pending-part2-table"></div>' +
		'</div>'
	);

	function init_filters() {
		// Load years
		frappe.call({
			method: 'nacstnew.nacstnew.page.postings_with_pengin.postings_with_pengin.get_distinct_posting_years',
			callback: function (r) {
				let opts = [''];
				if (r.message && Array.isArray(r.message)) {
					r.message.forEach(function (y) {
						if (y) opts.push(String(y));
					});
				}
				let $year = $('#pp_year');
				$year.empty();
				opts.forEach(function (opt) {
					$year.append(
						'<option value="' +
							frappe.utils.escape_html(opt) +
							'">' +
							frappe.utils.escape_html(opt) +
							'</option>'
					);
				});
			},
		});

		// Load units
		frappe.call({
			method: 'nacstnew.nacstnew.page.postings_with_pengin.postings_with_pengin.get_distinct_posting_units',
			callback: function (r) {
				let opts = [''];
				if (r.message && Array.isArray(r.message)) {
					r.message.forEach(function (u) {
						if (u) opts.push(u);
					});
				}
				let $unit = $('#pp_to_unit');
				$unit.empty();
				opts.forEach(function (opt) {
					$unit.append(
						'<option value="' +
							frappe.utils.escape_html(opt) +
							'">' +
							frappe.utils.escape_html(opt) +
							'</option>'
					);
				});
			},
		});

		// Change handlers
		$('#pp_year, #pp_to_unit, #pp_from_date, #pp_to_date').on('change', function () {
			load_data(1);
		});

		$('#pp_refresh').on('click', function () {
			load_data(1);
		});

		$('#pp_clear').on('click', function () {
			$('#pp_year').val('');
			$('#pp_to_unit').val('');
			$('#pp_from_date').val('');
			$('#pp_to_date').val('');
			load_data(1);
		});
	}

	function load_data(page_no) {
		page_no = page_no || 1;

		$('#pending-part2-table').html(
			'<div class="text-muted">' + __('Loading...') + '</div>'
		);

		frappe.call({
			method: 'nacstnew.nacstnew.page.postings_with_pengin.postings_with_pengin.get_postings_without_part2',
			args: {
				year: $('#pp_year').val() || null,
				to_unit: $('#pp_to_unit').val() || null,
				from_date: $('#pp_from_date').val() || null,
				to_date: $('#pp_to_date').val() || null,
				page: page_no,
				page_length: 50,
			},
			callback: function (r) {
				if (!r.message) {
					$('#pending-part2-table').html(
						'<div class="text-muted">' + __('No data') + '</div>'
					);
					return;
				}
				render_table(r.message);
			},
		});
	}

	function render_table(result) {
		let data = result.data || [];
		let total = result.total_count || 0;
		let page_no = result.page || 1;
		let total_pages = result.total_pages || 1;

		// Summary
		$('#pending-part2-summary').html(
			'<b>' +
				__('Total records without Part 2 Order: {0}', [total]) +
				'</b>'
		);

		if (!data.length) {
			$('#pending-part2-table').html(
				'<div class="text-muted">' +
					__('No posting records found for the selected filters.') +
					'</div>'
			);
			return;
		}

		let html = '';

		html += '<div class="table-responsive">';
		html += '<table class="table table-bordered table-sm">';
		html += '<thead>';
		html += '<tr>';
		html += '<th>' + __('Service Number') + '</th>';
		html += '<th>' + __('Name') + '</th>';
		html += '<th>' + __('Rank') + '</th>';
		html += '<th>' + __('Category') + '</th>';
		html += '<th>' + __('Posting Authority') + '</th>';
		html += '<th>' + __('From Unit') + '</th>';
		html += '<th>' + __('To Unit') + '</th>';
		html += '<th>' + __('Appointment') + '</th>';
		html += '<th>' + __('WEF Date') + '</th>';
		html += '<th>' + __('Posting Status') + '</th>';
		html += '</tr>';
		html += '</thead>';
		html += '<tbody>';

		data.forEach(function (row) {
			html += '<tr>';
			html +=
				'<td><a href="#Form/Personnel/' +
				frappe.utils.escape_html(row.service_number || '') +
				'">' +
				frappe.utils.escape_html(row.service_number || '') +
				'</a></td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.personnel_name || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.current_rank || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.category || '') +
				'</td>';
			html +=
				'<td>' +
				(row.posting_authority
					? '<a href="#Form/Posting Authority/' +
					  frappe.utils.escape_html(row.posting_authority) +
					  '">' +
					  frappe.utils.escape_html(row.posting_authority) +
					  '</a>'
					: '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.from_unit || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.to_unit || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.appointment || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.wef_date || '') +
				'</td>';
			html +=
				'<td>' +
				frappe.utils.escape_html(row.posting_status || '') +
				'</td>';
			html += '</tr>';
		});

		html += '</tbody>';
		html += '</table>';
		html += '</div>';

		// Pagination
		html += '<div class="mt-2">';
		html +=
			'<span class="mr-3">' +
			__('Page {0} of {1}', [page_no, total_pages]) +
			'</span>';

		html += '<div class="btn-group btn-group-sm" role="group">';
		html +=
			'<button class="btn btn-default" ' +
			(page_no <= 1 ? 'disabled' : '') +
			' data-page="' +
			(page_no - 1) +
			'">' +
			__('Prev') +
			'</button>';
		html +=
			'<button class="btn btn-default" ' +
			(page_no >= total_pages ? 'disabled' : '') +
			' data-page="' +
			(page_no + 1) +
			'">' +
			__('Next') +
			'</button>';
		html += '</div>';
		html += '</div>';

		$('#pending-part2-table').html(html);

		$('#pending-part2-table button[data-page]').on('click', function () {
			let p = parseInt($(this).attr('data-page'), 10);
			if (p && p > 0 && p <= total_pages) {
				load_data(p);
			}
		});
	}

	init_filters();
	load_data(1);
};
