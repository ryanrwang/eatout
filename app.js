// State
let currentMarker = null;
let currentCircle = null;
let radarMarker = null;
let pinSearchPopup = null;
let selectedRadius = 500;
let pinLat = null;
let pinLng = null;
let resultMarkers = [];
let isSearching = false;
let apiCallCount = 0;
let apiDailyLimit = 100;
let panelOpen = false;
let searchResults = [];
let activeCardIndex = -1;
let detailsCache = {};
let expandedCardIndex = -1;
let debugMode = localStorage.getItem('eatout_debug') === '1';
let bottomSheetState = 'hidden';
const isTouch = ('ontouchstart' in window) || window.matchMedia('(pointer: coarse)').matches;

// Mock data for debug mode
const MOCK_RESULTS = [
    {
        name: "Pai Northern Thai Kitchen", address: "18 Duncan St, Toronto, ON M5H 3G8",
        latitude: 43.6495, longitude: -79.3882, rating: 4.5, price_level: 2,
        cuisine_tags: ["thai_restaurant", "restaurant", "food"],
        image_url: "", phone: "(416) 901-4724", source: "google",
        source_url: "https://www.google.com/maps/place/?q=place_id:ChIJDbmGBaY0K4gRSTkwBKFSDgM",
        source_id: "ChIJDbmGBaY0K4gRSTkwBKFSDgM", distance: 0.0,
        review_count: 4812, is_closed: false
    },
    {
        name: "Kinka Izakaya Original", address: "398 Church St, Toronto, ON M5B 2A2",
        latitude: 43.6598, longitude: -79.3790, rating: 4.3, price_level: 2,
        cuisine_tags: ["japanese_restaurant", "sushi_restaurant", "restaurant"],
        image_url: "", phone: "(416) 977-0999", source: "google",
        source_url: "https://www.google.com/maps/place/?q=place_id:ChIJTSRBqKc0K4gRkH1MlUKJOGE",
        source_id: "ChIJTSRBqKc0K4gRkH1MlUKJOGE", distance: 0.0,
        review_count: 3241, is_closed: false
    },
    {
        name: "Richmond Station", address: "1 Richmond St W, Toronto, ON M5H 3W4",
        latitude: 43.6512, longitude: -79.3810, rating: 4.4, price_level: 3,
        cuisine_tags: ["restaurant", "brunch_restaurant", "cafe"],
        image_url: "", phone: "(647) 748-1444", source: "google",
        source_url: "https://www.google.com/maps/place/?q=place_id:ChIJm8Oc3qU0K4gRpkOXSGKTMhQ",
        source_id: "ChIJm8Oc3qU0K4gRpkOXSGKTMhQ", distance: 0.0,
        review_count: 1823, is_closed: true
    },
    {
        name: "Byblos Toronto", address: "11 Duncan St, Toronto, ON M5H 3G8",
        latitude: 43.6490, longitude: -79.3878, rating: 4.6, price_level: 4,
        cuisine_tags: ["mediterranean_restaurant", "restaurant"],
        image_url: "", phone: "(416) 637-7575", source: "google",
        source_url: "https://www.google.com/maps/place/?q=place_id:ChIJY7aDzaY0K4gRQ0K1fXn5n4o",
        source_id: "ChIJY7aDzaY0K4gRQ0K1fXn5n4o", distance: 0.0,
        review_count: 2456, is_closed: false
    },
    {
        name: "Sansotei Ramen", address: "179 Dundas St W, Toronto, ON M5G 1C7",
        latitude: 43.6543, longitude: -79.3865, rating: 4.2, price_level: 1,
        cuisine_tags: ["ramen_restaurant", "japanese_restaurant"],
        image_url: "", phone: "(647) 748-3833", source: "google",
        source_url: "https://www.google.com/maps/place/?q=place_id:ChIJ8xWPxqU0K4gR3S4DF9YIDQ0",
        source_id: "ChIJ8xWPxqU0K4gR3S4DF9YIDQ0", distance: 0.0,
        review_count: 987, is_closed: false
    }
];

const MOCK_DETAILS = {
    "ChIJDbmGBaY0K4gRSTkwBKFSDgM": {
        photos: [
            { name: "places/ChIJDbmGBaY0K4gRSTkwBKFSDgM/photos/AelY_Ct1a2bK", widthPx: 400, heightPx: 300 },
            { name: "places/ChIJDbmGBaY0K4gRSTkwBKFSDgM/photos/AelY_Ct2x9qR", widthPx: 400, heightPx: 300 },
            { name: "places/ChIJDbmGBaY0K4gRSTkwBKFSDgM/photos/AelY_Ct3m7nP", widthPx: 400, heightPx: 300 }
        ],
        hours: [
            { day: "Monday", open: "11:30 AM", close: "10:00 PM" },
            { day: "Tuesday", open: "11:30 AM", close: "10:00 PM" },
            { day: "Wednesday", open: "11:30 AM", close: "10:00 PM" },
            { day: "Thursday", open: "11:30 AM", close: "10:00 PM" },
            { day: "Friday", open: "11:30 AM", close: "11:00 PM" },
            { day: "Saturday", open: "11:00 AM", close: "11:00 PM" },
            { day: "Sunday", open: "11:00 AM", close: "10:00 PM" }
        ],
        phone: "(416) 901-4724", address: "18 Duncan St, Toronto, ON M5H 3G8",
        website: "https://www.paitoronto.com"
    },
    "ChIJTSRBqKc0K4gRkH1MlUKJOGE": {
        photos: [
            { name: "places/ChIJTSRBqKc0K4gRkH1MlUKJOGE/photos/AelY_DkR4wZ", widthPx: 400, heightPx: 300 }
        ],
        hours: [
            { day: "Monday", open: "5:00 PM", close: "11:00 PM" },
            { day: "Tuesday", open: "5:00 PM", close: "11:00 PM" },
            { day: "Wednesday", open: "5:00 PM", close: "11:00 PM" },
            { day: "Thursday", open: "5:00 PM", close: "11:00 PM" },
            { day: "Friday", open: "5:00 PM", close: "12:00 AM" },
            { day: "Saturday", open: "12:00 PM", close: "12:00 AM" },
            { day: "Sunday", open: "12:00 PM", close: "10:00 PM" }
        ],
        phone: "(416) 977-0999", address: "398 Church St, Toronto, ON M5B 2A2",
        website: "https://www.kinkaizakaya.com"
    },
    "ChIJm8Oc3qU0K4gRpkOXSGKTMhQ": {
        photos: [],
        hours: [],
        phone: "(647) 748-1444", address: "1 Richmond St W, Toronto, ON M5H 3W4",
        website: "https://www.richmondstation.ca"
    },
    "ChIJY7aDzaY0K4gRQ0K1fXn5n4o": {
        photos: [
            { name: "places/ChIJY7aDzaY0K4gRQ0K1fXn5n4o/photos/AelY_Bx8pQm", widthPx: 400, heightPx: 300 },
            { name: "places/ChIJY7aDzaY0K4gRQ0K1fXn5n4o/photos/AelY_Ck3rTn", widthPx: 400, heightPx: 300 }
        ],
        hours: [
            { day: "Monday", open: "5:00 PM", close: "10:00 PM" },
            { day: "Tuesday", open: "5:00 PM", close: "10:00 PM" },
            { day: "Wednesday", open: "5:00 PM", close: "10:00 PM" },
            { day: "Thursday", open: "5:00 PM", close: "10:00 PM" },
            { day: "Friday", open: "5:00 PM", close: "11:00 PM" },
            { day: "Saturday", open: "11:00 AM", close: "11:00 PM" },
            { day: "Sunday", open: "11:00 AM", close: "10:00 PM" }
        ],
        phone: "(416) 637-7575", address: "11 Duncan St, Toronto, ON M5H 3G8",
        website: "https://www.byblos.com"
    },
    "ChIJ8xWPxqU0K4gR3S4DF9YIDQ0": {
        photos: [
            { name: "places/ChIJ8xWPxqU0K4gR3S4DF9YIDQ0/photos/AelY_Fm2kLp", widthPx: 400, heightPx: 300 }
        ],
        hours: [
            { day: "Monday", open: "11:00 AM", close: "9:00 PM" },
            { day: "Tuesday", open: "11:00 AM", close: "9:00 PM" },
            { day: "Wednesday", open: "11:00 AM", close: "9:00 PM" },
            { day: "Thursday", open: "11:00 AM", close: "9:00 PM" },
            { day: "Friday", open: "11:00 AM", close: "9:30 PM" },
            { day: "Saturday", open: "11:00 AM", close: "9:30 PM" },
            { day: "Sunday", open: "11:00 AM", close: "9:00 PM" }
        ],
        phone: "(647) 748-3833", address: "179 Dundas St W, Toronto, ON M5G 1C7",
        website: null
    }
};

// Update API counter display
function updateApiCounter() {
    document.getElementById('api-counter').textContent = 'API: ' + apiCallCount + ' / ' + apiDailyLimit;
}
function updateUsageFromResponse(data) {
    if (data && data.usage) {
        apiCallCount = data.usage.today;
        apiDailyLimit = data.usage.limit;
        updateApiCounter();
    }
}
// Fetch global usage count on page load
fetch('api/usage.php').then(r => r.json()).then(data => {
    apiCallCount = data.today;
    apiDailyLimit = data.limit;
    updateApiCounter();
}).catch(() => {});
updateApiCounter();

// Cuisine data
const cuisineTypes = [
    { value: 'japanese_restaurant', label: 'Japanese' },
    { value: 'chinese_restaurant', label: 'Chinese' },
    { value: 'korean_restaurant', label: 'Korean' },
    { value: 'thai_restaurant', label: 'Thai' },
    { value: 'vietnamese_restaurant', label: 'Vietnamese' },
    { value: 'indian_restaurant', label: 'Indian' },
    { value: 'italian_restaurant', label: 'Italian' },
    { value: 'pizza_restaurant', label: 'Pizza' },
    { value: 'mexican_restaurant', label: 'Mexican' },
    { value: 'french_restaurant', label: 'French' },
    { value: 'mediterranean_restaurant', label: 'Mediterranean' },
    { value: 'hamburger_restaurant', label: 'Hamburger' },
    { value: 'seafood_restaurant', label: 'Seafood' },
    { value: 'sushi_restaurant', label: 'Sushi' },
    { value: 'ramen_restaurant', label: 'Ramen' },
    { value: 'barbecue_restaurant', label: 'Barbecue' },
    { value: 'vegan_restaurant', label: 'Vegan' },
    { value: 'breakfast_restaurant', label: 'Breakfast' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'dessert_restaurant', label: 'Dessert' },
];

// Build cuisine dropdown checkboxes
const cuisineDropdown = document.getElementById('cuisine-dropdown');
const cuisineItems = document.createElement('div');
cuisineItems.className = 'cuisine-items';
cuisineDropdown.appendChild(cuisineItems);
cuisineTypes.forEach(c => {
    const lbl = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = c.value;
    cb.addEventListener('change', function() {
        updateCuisineToggle();
        saveFiltersToSession();
    });
    lbl.appendChild(cb);
    lbl.appendChild(document.createTextNode(c.label));
    cuisineItems.appendChild(lbl);
});

// Cuisine footer: Clear all + Apply
(function() {
    var footer = document.createElement('div');
    footer.className = 'cuisine-footer';

    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn-tertiary btn-s cuisine-clear-btn';
    clearBtn.textContent = 'Clear all';
    clearBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        cuisineDropdown.querySelectorAll('input:checked').forEach(function(cb) {
            cb.checked = false;
        });
        updateCuisineToggle();
        saveFiltersToSession();
    });

    var applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'btn-primary btn-s cuisine-apply-btn';
    applyBtn.textContent = 'Apply';
    applyBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        cuisineDropdown.classList.remove('open');
    });

    footer.appendChild(clearBtn);
    footer.appendChild(applyBtn);
    cuisineDropdown.appendChild(footer);
})();

function updateCuisineToggle() {
    const checked = Array.from(cuisineDropdown.querySelectorAll('input:checked'));
    const count = checked.length;
    const btn = document.getElementById('cuisine-toggle');
    const label = btn.querySelector('.filter-label');
    if (count === 0) {
        label.textContent = 'Any cuisine';
        btn.classList.remove('filter-active');
    } else if (count === 1) {
        var match = cuisineTypes.find(function(c) { return c.value === checked[0].value; });
        label.textContent = match ? match.label : checked[0].value;
        btn.classList.add('filter-active');
    } else {
        label.textContent = count + ' Cuisines';
        btn.classList.add('filter-active');
    }
}

// Price badge no longer needed — toggle text shows range

// Filter persistence (sessionStorage)
function saveFiltersToSession() {
    var cuisines = Array.from(cuisineDropdown.querySelectorAll('input:checked')).map(function(cb) { return cb.value; });
    var priceRange = window._getPriceRange ? window._getPriceRange() : { min: 1, max: 4 };
    var sort = document.getElementById('filter-sort').value;
    var date = document.getElementById('filter-date').value;
    var time = document.getElementById('filter-time').value;
    sessionStorage.setItem('eatout_filters', JSON.stringify({
        cuisines: cuisines, priceRange: priceRange, sort: sort, date: date, time: time, radius: selectedRadius
    }));
    // Show search button if results are stale due to filter change
    if (searchResults.length > 0 && pinLat !== null && !pinSearchPopup) {
        showPinSearchPopup(pinLat, pinLng);
    }
}

function restoreFiltersFromSession() {
    var saved = sessionStorage.getItem('eatout_filters');
    if (!saved) return;
    try {
        var f = JSON.parse(saved);
        if (f.cuisines && f.cuisines.length) {
            cuisineDropdown.querySelectorAll('input').forEach(function(cb) {
                cb.checked = f.cuisines.indexOf(cb.value) !== -1;
            });
            updateCuisineToggle();
        }
        if (f.priceRange && window._setPriceRange) {
            window._setPriceRange(f.priceRange.min, f.priceRange.max);
        }
        if (f.sort) document.getElementById('filter-sort').value = f.sort;
        if (f.date) {
            document.getElementById('filter-date').value = f.date;
            updateDateToggle();
        }
        if (f.time) {
            document.getElementById('filter-time').value = f.time;
            if (window._syncTimeDisplay) window._syncTimeDisplay();
        }
        if (f.radius) {
            selectedRadius = f.radius;
            setRadius(selectedRadius);
        }
    } catch (e) {}
}

// Close all filter dropdowns
function anyDropdownOpen() {
    return cuisineDropdown.classList.contains('open') ||
        document.getElementById('price-dropdown').classList.contains('open') ||
        document.getElementById('date-dropdown').classList.contains('open') ||
        document.getElementById('time-dropdown').classList.contains('open') ||
        document.getElementById('radius-dropdown').classList.contains('open');
}
function closeAllDropdowns() {
    cuisineDropdown.classList.remove('open');
    document.getElementById('price-dropdown').classList.remove('open');
    document.getElementById('date-dropdown').classList.remove('open');
    document.getElementById('time-dropdown').classList.remove('open');
    document.getElementById('radius-dropdown').classList.remove('open');
}

// Cuisine dropdown toggle
document.getElementById('cuisine-toggle').addEventListener('click', function (e) {
    e.stopPropagation();
    var wasOpen = cuisineDropdown.classList.contains('open');
    closeAllDropdowns();
    if (!wasOpen) cuisineDropdown.classList.add('open');
    if (cuisineDropdown.classList.contains('open')) {
        var first = cuisineDropdown.querySelector('input[type="checkbox"]');
        if (first) first.focus();
    }
});
document.addEventListener('click', function (e) {
    if (!e.target.closest('.cuisine-wrapper')) {
        cuisineDropdown.classList.remove('open');
    }
});

// Price dropdown toggle
document.getElementById('price-toggle').addEventListener('click', function(e) {
    e.stopPropagation();
    var dd = document.getElementById('price-dropdown');
    var wasOpen = dd.classList.contains('open');
    closeAllDropdowns();
    if (!wasOpen) dd.classList.add('open');
});
document.addEventListener('click', function(e) {
    if (!e.target.closest('.price-wrapper')) {
        document.getElementById('price-dropdown').classList.remove('open');
    }
});

// Price checkboxes
(function() {
    var dd = document.getElementById('price-dropdown');
    var labels = ['$', '$$', '$$$', '$$$$'];

    function getActivePrices() {
        return Array.from(dd.querySelectorAll('input:checked')).map(function(cb) { return parseInt(cb.value); });
    }

    function updateToggle() {
        var btn = document.getElementById('price-toggle');
        var label = btn.querySelector('.filter-label');
        var active = getActivePrices().sort();
        var priceText;
        if (active.length === 0 || active.length === 4) {
            priceText = 'Any price';
            btn.classList.remove('filter-active');
        } else {
            // Check if contiguous
            var isContiguous = true;
            for (var i = 1; i < active.length; i++) {
                if (active[i] !== active[i - 1] + 1) { isContiguous = false; break; }
            }
            if (active.length === 1) {
                priceText = labels[active[0] - 1];
            } else if (isContiguous) {
                priceText = labels[active[0] - 1] + '\u2013' + labels[active[active.length - 1] - 1];
            } else {
                priceText = active.map(function(v) { return labels[v - 1]; }).join(', ');
            }
            btn.classList.add('filter-active');
        }
        label.textContent = priceText;
    }

    dd.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
        cb.addEventListener('change', function() {
            updateToggle();
            saveFiltersToSession();
        });
    });

    // Clear button
    dd.querySelector('.price-clear-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        dd.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });
        updateToggle();
        saveFiltersToSession();
    });

    // Apply button (just close)
    dd.querySelector('.price-apply-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        dd.classList.remove('open');
    });

    updateToggle();

    window._getActivePrices = getActivePrices;
    window._getPriceRange = function() {
        var active = getActivePrices();
        if (!active.length) return { min: 1, max: 4 };
        return { min: Math.min.apply(null, active), max: Math.max.apply(null, active) };
    };
    window._setPriceRange = function(min, max) {
        dd.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
            var v = parseInt(cb.value);
            cb.checked = v >= min && v <= max;
        });
        updateToggle();
    };
})();

// Date defaults to "Any date" (unset)
function updateDateToggle() {
    var dateVal = document.getElementById('filter-date').value;
    var btn = document.getElementById('date-toggle');
    var label = document.getElementById('date-display');
    if (dateVal) {
        label.textContent = dateVal;
        btn.classList.add('filter-active');
    } else {
        label.textContent = 'Any date';
        btn.classList.remove('filter-active');
    }
}
updateDateToggle();

// Custom calendar date picker
(function() {
    var dateToggle = document.getElementById('date-toggle');
    var dateDropdown = document.getElementById('date-dropdown');
    var dateInput = document.getElementById('filter-date');
    var viewYear, viewMonth; // currently displayed month

    function pad(n) { return String(n).padStart(2, '0'); }
    function toISO(y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); }

    var MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

    function initView() {
        if (dateInput.value) {
            var parts = dateInput.value.split('-');
            viewYear = parseInt(parts[0]);
            viewMonth = parseInt(parts[1]) - 1;
        } else {
            var now = new Date();
            viewYear = now.getFullYear();
            viewMonth = now.getMonth();
        }
    }

    function renderCalendar() {
        var today = new Date();
        var todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());
        var selectedISO = dateInput.value || '';

        var html = '<div class="date-cal-header">';
        html += '<button type="button" class="date-prev-btn"><span class="material-symbols-outlined">chevron_left</span></button>';
        html += '<span class="date-cal-title">' + MONTH_NAMES[viewMonth] + ' ' + viewYear + '</span>';
        html += '<button type="button" class="date-next-btn"><span class="material-symbols-outlined">chevron_right</span></button>';
        html += '</div>';

        html += '<div class="date-cal-weekdays">';
        DAY_NAMES.forEach(function(d) { html += '<span>' + d + '</span>'; });
        html += '</div>';

        // Calculate first day of month and number of days
        var firstDay = new Date(viewYear, viewMonth, 1).getDay();
        var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        var daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        html += '<div class="date-cal-days">';

        // Previous month trailing days
        for (var p = firstDay - 1; p >= 0; p--) {
            var prevDay = daysInPrevMonth - p;
            var pm = viewMonth === 0 ? 11 : viewMonth - 1;
            var py = viewMonth === 0 ? viewYear - 1 : viewYear;
            var iso = toISO(py, pm, prevDay);
            html += '<button type="button" class="date-cal-day other-month" data-date="' + iso + '">' + prevDay + '</button>';
        }

        // Current month days
        for (var d = 1; d <= daysInMonth; d++) {
            var iso = toISO(viewYear, viewMonth, d);
            var cls = 'date-cal-day';
            if (iso === todayISO) cls += ' today';
            if (iso === selectedISO) cls += ' selected';
            html += '<button type="button" class="' + cls + '" data-date="' + iso + '">' + d + '</button>';
        }

        // Next month leading days to fill grid
        var totalCells = firstDay + daysInMonth;
        var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (var n = 1; n <= remaining; n++) {
            var nm = viewMonth === 11 ? 0 : viewMonth + 1;
            var ny = viewMonth === 11 ? viewYear + 1 : viewYear;
            var iso = toISO(ny, nm, n);
            html += '<button type="button" class="date-cal-day other-month" data-date="' + iso + '">' + n + '</button>';
        }

        html += '</div>';

        html += '<div class="date-cal-footer">';
        html += '<button type="button" class="btn-tertiary btn-s date-clear-btn">Clear</button>';
        html += '<button type="button" class="btn-primary btn-s date-apply-btn">Apply</button>';
        html += '</div>';

        dateDropdown.innerHTML = html;
    }

    function setDateValue(iso) {
        dateInput.value = iso;
        updateDateToggle();
        saveFiltersToSession();
        renderCalendar();
    }

    // Event delegation for calendar clicks
    dateDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
        var dayBtn = e.target.closest('.date-cal-day');
        if (dayBtn) {
            setDateValue(dayBtn.dataset.date);
            return;
        }
        if (e.target.closest('.date-prev-btn')) {
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            renderCalendar();
            return;
        }
        if (e.target.closest('.date-next-btn')) {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            renderCalendar();
            return;
        }
        if (e.target.closest('.date-clear-btn')) {
            dateInput.value = '';
            updateDateToggle();
            saveFiltersToSession();
            initView();
            renderCalendar();
            return;
        }
        if (e.target.closest('.date-apply-btn')) {
            dateDropdown.classList.remove('open');
            return;
        }
    });

    // Toggle dropdown
    dateToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var wasOpen = dateDropdown.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) {
            initView();
            renderCalendar();
            dateDropdown.classList.add('open');
        }
    });

    // Outside click to close
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.date-wrapper')) {
            dateDropdown.classList.remove('open');
        }
    });
})();

// Time dropdown
(function() {
    var timeToggle = document.getElementById('time-toggle');
    var timeDropdown = document.getElementById('time-dropdown');
    var timeInput = document.getElementById('filter-time');

    function formatTime12(h, m) {
        var period = h >= 12 ? 'PM' : 'AM';
        var hour12 = h % 12 || 12;
        return hour12 + ':' + String(m).padStart(2, '0') + ' ' + period;
    }

    function formatTime24(h, m) {
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    // "Any time" option
    var anySlot = document.createElement('div');
    anySlot.className = 'time-slot';
    anySlot.textContent = 'Any time';
    anySlot.dataset.value = '';
    timeDropdown.appendChild(anySlot);

    // Build single list of time slots
    for (var h = 0; h < 24; h++) {
        for (var m = 0; m < 60; m += 30) {
            var slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = formatTime12(h, m);
            slot.dataset.value = formatTime24(h, m);
            timeDropdown.appendChild(slot);
        }
    }

    function setTimeValue(val24) {
        timeInput.value = val24;
        var label = timeToggle.querySelector('.filter-label');
        if (!val24) {
            label.textContent = 'Any time';
            timeToggle.classList.remove('filter-active');
        } else {
            var parts = val24.split(':');
            label.textContent = formatTime12(parseInt(parts[0]), parseInt(parts[1]));
            timeToggle.classList.add('filter-active');
        }
        timeDropdown.querySelectorAll('.time-slot').forEach(function(s) {
            s.classList.toggle('active', s.dataset.value === val24);
        });
        saveFiltersToSession();
    }

    function syncDisplay() {
        var val = timeInput.value;
        var label = timeToggle.querySelector('.filter-label');
        if (!val) {
            label.textContent = 'Any time';
            timeToggle.classList.remove('filter-active');
        } else {
            var parts = val.split(':');
            label.textContent = formatTime12(parseInt(parts[0]), parseInt(parts[1]));
            timeToggle.classList.add('filter-active');
        }
        timeDropdown.querySelectorAll('.time-slot').forEach(function(s) {
            s.classList.toggle('active', s.dataset.value === val);
        });
    }
    syncDisplay();

    timeDropdown.addEventListener('click', function(e) {
        var slot = e.target.closest('.time-slot');
        if (!slot) return;
        setTimeValue(slot.dataset.value);
        timeDropdown.classList.remove('open');
    });

    timeToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var wasOpen = timeDropdown.classList.contains('open');
        closeAllDropdowns();
        if (!wasOpen) timeDropdown.classList.add('open');
        if (timeDropdown.classList.contains('open')) {
            var active = timeDropdown.querySelector('.time-slot.active');
            if (active && active.dataset.value) {
                active.scrollIntoView({ block: 'center' });
            } else {
                // Scroll to 5PM centered when no time selected
                var slot5pm = timeDropdown.querySelector('.time-slot[data-value="17:00"]');
                if (slot5pm) slot5pm.scrollIntoView({ block: 'center' });
            }
        }
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.time-wrapper')) {
            timeDropdown.classList.remove('open');
        }
    });

    window._syncTimeDisplay = syncDisplay;
})();

// Restore filters from session (overrides defaults if saved)
restoreFiltersFromSession();

// Filter change handlers for persistence
document.getElementById('filter-sort').addEventListener('change', function() {
    saveFiltersToSession();
    // Re-search if we have results
    if (searchResults.length > 0 && pinLat !== null) {
        performSearch();
    }
});

// Notification system
let notificationTimer = null;
function showNotification(message, type) {
    const el = document.getElementById('notification');
    el.textContent = message;
    el.className = type;
    el.style.display = 'block';
    clearTimeout(notificationTimer);
    notificationTimer = setTimeout(() => { el.style.display = 'none'; }, 5000);
}

// Search button state (filter bar button removed; pin popup button still exists)
function updateSearchButtonState() {
    const btn = document.getElementById('search-btn');
    if (!btn) return;
    if (isSearching) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span>';
    } else {
        btn.disabled = pinLat === null;
        btn.textContent = 'Search';
    }
}

// Helper: is mobile viewport
function isMobile() {
    return window.innerWidth < 768;
}

// URL hash state
function updateUrlHash() {
    if (pinLat === null) return;
    var hash = '#lat=' + pinLat.toFixed(6) + '&lng=' + pinLng.toFixed(6) + '&r=' + selectedRadius;
    history.replaceState(null, '', hash);
}

function readUrlHash() {
    var hash = location.hash.substring(1);
    if (!hash) return null;
    var params = new URLSearchParams(hash);
    var lat = parseFloat(params.get('lat'));
    var lng = parseFloat(params.get('lng'));
    var r = parseInt(params.get('r'));
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat: lat, lng: lng, r: isNaN(r) ? 1000 : r };
}

// Clear result markers (without hiding panel)
function clearResultMarkers() {
    resultMarkers.forEach(m => map.removeLayer(m));
    resultMarkers = [];
    searchResults = [];
    activeCardIndex = -1;
    expandedCardIndex = -1;
    detailsCache = {};
    document.getElementById('result-cards').innerHTML = '';
    document.getElementById('panel-attribution').style.display = 'none';
}

// Build cuisine label lookup
const cuisineLabelMap = {};
cuisineTypes.forEach(c => { cuisineLabelMap[c.value] = c.label; });

function friendlyCuisine(tag) {
    if (cuisineLabelMap[tag]) return cuisineLabelMap[tag];
    return tag.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function formatDistance(lat1, lng1, lat2, lng2) {
    const d = map.distance([lat1, lng1], [lat2, lng2]);
    if (d < 1000) return Math.round(d) + 'm';
    return (d / 1000).toFixed(1) + 'km';
}

// Bottom sheet helpers
function setBottomSheetTransform(animate) {
    var panel = document.getElementById('results-panel');
    panel.style.transition = animate !== false ? 'transform 0.3s ease' : 'none';
    var sheetH = 'calc(100vh - 164px)';
    switch (bottomSheetState) {
        case 'collapsed':
            panel.style.transform = 'translateY(calc(' + sheetH + ' - 48px))';
            break;
        case 'half':
            panel.style.transform = 'translateY(calc(' + sheetH + ' / 2))';
            break;
        case 'full':
            panel.style.transform = 'translateY(0)';
            break;
        default:
            panel.style.transform = 'translateY(100vh)';
            break;
    }
}

function updateBottomSheetCount() {
    var el = document.getElementById('bs-count');
    if (!el) return;
    var n = searchResults.length;
    el.textContent = n + (n === 1 ? ' restaurant' : ' restaurants');
}

// Update panel count in header
function updatePanelCount() {
    var el = document.getElementById('panel-count');
    if (!el) return;
    var n = searchResults.length;
    el.textContent = n + (n === 1 ? ' restaurant' : ' restaurants');
}

// Update results panel top — sit at 12px when filter bar doesn't overlap, else below it
function updatePanelTop() {
    var panel = document.getElementById('results-panel');
    if (panel.style.display === 'none' || isMobile()) return;
    var filterBar = document.getElementById('filter-bar');
    var filterRect = filterBar.getBoundingClientRect();
    var panelRight = 12 + 360; // left + width
    if (filterRect.left >= panelRight) {
        panel.style.top = '12px';
    } else {
        panel.style.top = (12 + filterBar.offsetHeight + 8) + 'px';
    }
}

// Center pin in visible map area (accounts for panel on desktop)
function centerPinOnMap() {
    if (pinLat === null) return;
    if (isMobile()) {
        map.panTo([pinLat, pinLng], { animate: true, duration: 0.3 });
        return;
    }
    var panelWidth = panelOpen ? 384 : 0;
    var mapSize = map.getSize();
    var visibleCenterX = panelWidth + (mapSize.x - panelWidth) / 2;
    var visibleCenterY = mapSize.y / 2;
    var pinPoint = map.latLngToContainerPoint([pinLat, pinLng]);
    var dx = pinPoint.x - visibleCenterX;
    var dy = pinPoint.y - visibleCenterY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        map.panBy([dx, dy], { animate: true, duration: 0.3 });
    }
}

// Panel show/hide with floating animation
function showResultsPanel() {
    var panel = document.getElementById('results-panel');

    if (isMobile()) {
        if (panelOpen) {
            updateBottomSheetCount();
            updatePanelCount();
            return;
        }
        panel.style.display = 'flex';
        panel.style.opacity = '1';
        panel.style.transform = 'none';
        bottomSheetState = 'collapsed';
        setBottomSheetTransform(false);
        requestAnimationFrame(function() {
            panel.style.transition = 'transform 0.3s ease';
        });
        panelOpen = true;
        updateBottomSheetCount();
        updatePanelCount();
        return;
    }

    // Desktop behavior
    if (panelOpen) {
        updatePanelCount();
        return;
    }

    // Position: at top when filter bar doesn't overlap, else below it
    var filterBar = document.getElementById('filter-bar');
    var filterRect = filterBar.getBoundingClientRect();
    var panelRight = 12 + 360;
    if (filterRect.left >= panelRight) {
        panel.style.top = '12px';
    } else {
        panel.style.top = (12 + filterBar.offsetHeight + 8) + 'px';
    }

    panel.style.display = 'flex';
    panel.offsetHeight; // force reflow
    panel.classList.add('visible');
    panelOpen = true;
    updatePanelCount();

    // Center pin in visible area right of panel
    centerPinOnMap();
}

function hideResultsPanel() {
    var panel = document.getElementById('results-panel');

    if (isMobile()) {
        panel.style.transition = 'transform 0.3s ease';
        panel.style.transform = 'translateY(100vh)';
        bottomSheetState = 'hidden';
        panelOpen = false;
        setTimeout(function() {
            if (!panelOpen) panel.style.display = 'none';
        }, 320);
        return;
    }

    // Desktop behavior
    panel.classList.remove('visible');
    panelOpen = false;
    // Center pin back in full map
    centerPinOnMap();
    setTimeout(function() {
        if (!panelOpen) panel.style.display = 'none';
    }, 320);
}

// Marker highlight
function highlightMarker(index) {
    if (index < 0 || index >= resultMarkers.length) return;
    const marker = resultMarkers[index];
    const el = marker.getElement();
    if (el) {
        const dot = el.querySelector('.result-marker');
        if (dot) {
            dot.classList.remove('bounce-out');
            dot.classList.add('highlighted', 'bounce-in');
        }
    }
    // Also bounce the card number in the panel
    const cardNum = document.querySelector('.result-card[data-index="' + index + '"] .card-number');
    if (cardNum) {
        cardNum.classList.remove('bounce-out');
        cardNum.classList.add('bounce-in');
    }
}

function unhighlightMarker(index) {
    if (index < 0 || index >= resultMarkers.length) return;
    const marker = resultMarkers[index];
    const el = marker.getElement();
    if (el) {
        const dot = el.querySelector('.result-marker');
        if (dot) {
            dot.classList.remove('highlighted', 'bounce-in');
            dot.classList.add('bounce-out');
        }
    }
    const cardNum = document.querySelector('.result-card[data-index="' + index + '"] .card-number');
    if (cardNum) {
        cardNum.classList.remove('bounce-in');
        cardNum.classList.add('bounce-out');
    }
}

function scrollToCard(index) {
    const card = document.querySelector('.result-card[data-index="' + index + '"]');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    card.classList.remove('flash');
    card.offsetHeight;
    card.classList.add('flash');
}

// Fetch place details
async function fetchDetails(sourceId) {
    if (debugMode && MOCK_DETAILS[sourceId]) {
        await new Promise(r => setTimeout(r, 300 + Math.random() * 400));
        return MOCK_DETAILS[sourceId];
    }
    const resp = await fetch('api/details.php?place_id=' + encodeURIComponent(sourceId));
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to fetch details');
    return data;
}

// Build OpenTable search URL
function buildOpenTableUrl(name) {
    const dateVal = document.getElementById('filter-date').value;
    const timeVal = document.getElementById('filter-time').value;
    let dateTime = '';
    if (dateVal && timeVal) dateTime = dateVal + 'T' + timeVal;
    let url = 'https://www.opentable.com/s?term=' + encodeURIComponent(name);
    if (dateTime) url += '&dateTime=' + encodeURIComponent(dateTime);
    return url;
}

// Render expanded detail HTML
function renderCardDetails(index, details) {
    const r = searchResults[index];
    let html = '';

    if (details.photos && details.photos.length > 0) {
        html += '<div class="detail-photos">';
        details.photos.slice(0, 3).forEach(p => {
            const src = 'api/photo.php?name=' + encodeURIComponent(p.name) + '&maxwidth=300';
            html += '<img src="' + escapeHtml(src) + '" alt="Photo of ' + escapeHtml(r.name) + '" onerror="this.style.display=\'none\'">';
        });
        html += '</div>';
    }

    if (details.hours && details.hours.length > 0) {
        const today = new Date().getDay();
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const todayName = dayNames[today];
        html += '<div class="detail-hours"><div class="detail-hours-title">Hours</div>';
        details.hours.forEach(h => {
            const isToday = h.day === todayName;
            html += '<div class="detail-hours-row' + (isToday ? ' today' : '') + '">';
            html += '<span class="detail-hours-day">' + escapeHtml(h.day) + '</span>';
            html += '<span>' + escapeHtml(h.open) + ' \u2013 ' + escapeHtml(h.close) + '</span>';
            html += '</div>';
        });
        html += '</div>';
    } else {
        html += '<div class="detail-hours" style="color:#aaa;">Hours not available</div>';
    }

    html += '<div class="detail-links">';

    if (details.phone || r.phone) {
        const phone = details.phone || r.phone;
        html += '<a class="detail-link" href="tel:' + escapeHtml(phone) + '"><span class="material-symbols-outlined">call</span> ' + escapeHtml(phone) + '</a>';
    }

    if (details.website) {
        let domain = details.website;
        try { domain = new URL(details.website).hostname; } catch(e) {}
        html += '<a class="detail-link" href="' + escapeHtml(details.website) + '" target="_blank" rel="noopener"><span class="material-symbols-outlined">language</span> ' + escapeHtml(domain) + '</a>';
    }

    html += '<a class="detail-link detail-link-primary" href="' + escapeHtml(r.source_url || '#') + '" target="_blank" rel="noopener">View on Google Maps</a>';
    html += '<a class="detail-link detail-link-opentable" href="' + escapeHtml(buildOpenTableUrl(r.name)) + '" target="_blank" rel="noopener">Find on OpenTable</a>';

    html += '</div>';

    if (details.cached) {
        html += '<div style="text-align:right;font-size:12px;color:#aaa;margin-top:4px;">cached</div>';
    }

    return html;
}

// Collapse currently expanded card
function collapseExpandedCard() {
    if (expandedCardIndex === -1) return;
    const card = document.querySelector('.result-card[data-index="' + expandedCardIndex + '"]');
    if (card) {
        const detail = card.querySelector('.card-detail');
        if (detail) detail.classList.remove('open');
    }
    expandedCardIndex = -1;
}

// Toggle card expansion
async function toggleCardExpansion(index) {
    if (expandedCardIndex === index) {
        collapseExpandedCard();
        return;
    }

    collapseExpandedCard();

    const card = document.querySelector('.result-card[data-index="' + index + '"]');
    if (!card) return;

    let detail = card.querySelector('.card-detail');
    if (!detail) {
        detail = document.createElement('div');
        detail.className = 'card-detail';
        card.appendChild(detail);
    }

    expandedCardIndex = index;
    const r = searchResults[index];

    if (detailsCache[r.source_id]) {
        detail.innerHTML = '<div class="card-detail-inner">' + renderCardDetails(index, detailsCache[r.source_id]) + '</div>';
        detail.offsetHeight;
        detail.classList.add('open');
        return;
    }

    detail.innerHTML = '<div class="detail-spinner"><span class="spinner"></span></div>';
    detail.offsetHeight;
    detail.classList.add('open');

    try {
        const data = await fetchDetails(r.source_id);
        detailsCache[r.source_id] = data;
        updateUsageFromResponse(data);

        if (expandedCardIndex === index) {
            detail.innerHTML = '<div class="card-detail-inner">' + renderCardDetails(index, data) + '</div>';
        }
    } catch (err) {
        if (expandedCardIndex === index) {
            detail.innerHTML = '<div class="card-detail-inner"><div class="detail-error">Could not load details</div></div>';
        }
    }
}

// Skeleton loading cards
function showSkeletonCards() {
    var container = document.getElementById('result-cards');
    var html = '';
    for (var i = 0; i < 4; i++) {
        html += '<div class="skeleton-card">';
        html += '<div class="skeleton-line title"></div>';
        html += '<div class="skeleton-line rating"></div>';
        html += '<div class="skeleton-line tags"></div>';
        html += '</div>';
    }
    container.innerHTML = html;
    document.getElementById('panel-attribution').style.display = 'none';
}

// Initial empty state
function showInitialEmptyState() {
    var container = document.getElementById('result-cards');
    container.innerHTML = '<div class="panel-empty-initial">' +
        '<span class="material-symbols-outlined" style="font-size:36px;color:#d1d5db;">location_on</span>' +
        '<div>Drop a pin and search to find restaurants</div>' +
        '</div>';
}

// Render result cards
function renderResultCards(results) {
    const container = document.getElementById('result-cards');
    container.innerHTML = '';
    expandedCardIndex = -1;

    if (results.length === 0) {
        container.innerHTML = '<div class="panel-empty">No restaurants found in this area.</div>';
        document.getElementById('panel-attribution').style.display = 'none';
        return;
    }

    results.forEach((r, i) => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.dataset.index = i;
        card.setAttribute('tabindex', '0');

        const stars = '\u2605'.repeat(Math.round(r.rating || 0));
        const price = r.price_level ? '$'.repeat(r.price_level) : '';
        const dist = (pinLat !== null) ? formatDistance(pinLat, pinLng, r.latitude, r.longitude) : '';
        const tags = (r.cuisine_tags || []).slice(0, 3).map(t => '<span class="card-tag">' + escapeHtml(friendlyCuisine(t)) + '</span>').join('');

        let html = '<div class="card-header">';
        html += '<button type="button" class="card-number card-map-trigger" title="Show on map">' + (i + 1) + '</button>';
        html += '<div class="card-title-row">';
        html += '<a class="card-name" href="' + escapeHtml(r.source_url || '#') + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + escapeHtml(r.name) + '</a>';
        if (r.is_closed) html += '<span class="card-closed">Closed</span>';
        if (r.rating) {
            html += '<div class="card-rating"><span class="stars">' + stars + '</span> <span class="rating-num">' + r.rating + '</span>';
            if (r.review_count) html += ' <span class="review-count">(' + r.review_count + ' reviews)</span>';
            html += '</div>';
        }
        html += '</div>';
        html += '<button type="button" class="card-map-btn" title="Show on map"><span class="material-symbols-outlined">pin_drop</span></button>';
        html += '</div>';

        html += '<div class="card-meta">';
        if (price) html += '<span class="card-price">' + price + '</span>';
        if (dist) html += '<span class="card-distance">' + dist + '</span>';
        html += '</div>';

        if (tags) html += '<div class="card-tags">' + tags + '</div>';

        if (r.address) html += '<div class="card-address">' + escapeHtml(r.address) + '</div>';
        if (r.phone) html += '<div class="card-phone">' + escapeHtml(r.phone) + '</div>';

        card.innerHTML = html;

        card.addEventListener('mouseenter', () => highlightMarker(i));
        card.addEventListener('mouseleave', () => unhighlightMarker(i));

        card.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('.card-map-btn') || e.target.closest('.card-map-trigger') || e.target.closest('.card-detail-inner')) return;
            toggleCardExpansion(i);
        });

        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                if (e.target.closest('a') || e.target.closest('.card-map-btn') || e.target.closest('.card-map-trigger')) return;
                e.preventDefault();
                toggleCardExpansion(i);
            }
        });

        const mapBtn = card.querySelector('.card-map-btn');
        const mapTrigger = card.querySelector('.card-map-trigger');
        const showOnMap = () => {
            if (i < resultMarkers.length) {
                map.panTo(resultMarkers[i].getLatLng());
                resultMarkers[i].openPopup();
            }
        };
        mapBtn.addEventListener('click', (e) => { e.stopPropagation(); showOnMap(); });
        mapTrigger.addEventListener('click', (e) => { e.stopPropagation(); showOnMap(); });

        container.appendChild(card);
    });

    document.getElementById('panel-attribution').style.display = 'block';
    updatePanelCount();
}

// Display results on map and panel
function displayResults(results) {
    clearResultMarkers();
    searchResults = results;

    if (results.length === 0) {
        showNotification('No restaurants found in this area.', 'info');
        if (panelOpen) hideResultsPanel();
        return;
    }

    results.forEach((r, i) => {
        const icon = L.divIcon({
            className: '',
            html: '<div class="result-marker">' + (i + 1) + '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
        const marker = L.marker([r.latitude, r.longitude], { icon: icon }).addTo(map);

        const stars = '\u2605'.repeat(Math.round(r.rating || 0));
        const price = '$'.repeat(r.price_level || 0);
        let html = '<div class="result-popup">';
        html += '<h3>' + (i + 1) + '. ' + escapeHtml(r.name) + '</h3>';
        if (r.rating) {
            html += '<div class="meta"><span class="stars">' + stars + '</span> ' +
                    r.rating + (r.review_count ? ' (' + r.review_count + ')' : '') + '</div>';
        }
        if (price) html += '<div class="meta">' + price + '</div>';
        if (r.address) html += '<div class="meta">' + escapeHtml(r.address) + '</div>';
        if (r.source_url) html += '<a href="' + escapeHtml(r.source_url) + '" target="_blank" rel="noopener">View on Google Maps</a>';
        html += '</div>';
        marker.bindPopup(html);

        marker.on('mouseover', () => highlightMarker(i));
        marker.on('mouseout', () => unhighlightMarker(i));

        marker.on('click', () => {
            if (panelOpen) scrollToCard(i);
            else {
                showResultsPanel();
                setTimeout(() => scrollToCard(i), 350);
            }
        });

        resultMarkers.push(marker);
    });

    renderResultCards(results);
    if (!panelOpen) showResultsPanel();
    if (isMobile()) updateBottomSheetCount();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Perform search
async function performSearch() {
    if (pinLat === null || isSearching) return;

    isSearching = true;
    updateSearchButtonState();

    // Close pin search popup
    if (pinSearchPopup) {
        map.closePopup(pinSearchPopup);
        pinSearchPopup = null;
    }

    // Show skeleton loading
    showSkeletonCards();
    if (!panelOpen) showResultsPanel();

    // Debug mode: use mock data
    if (debugMode) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
        let results = MOCK_RESULTS.map((r, i) => ({
            ...r,
            latitude: pinLat + (r.latitude - 43.6532) * 0.5,
            longitude: pinLng + (r.longitude - (-79.3832)) * 0.5,
        }));
        results = results.slice(0, 10);
        displayResults(results);
        showNotification('Debug mode: showing mock data', 'info');
        isSearching = false;
        updateSearchButtonState();
        return;
    }

    // Build params
    const params = new URLSearchParams();
    params.set('latitude', pinLat);
    params.set('longitude', pinLng);
    params.set('radius', selectedRadius);
    params.set('sort_by', document.getElementById('filter-sort').value);
    params.set('limit', '20');

    const selectedCuisines = Array.from(cuisineDropdown.querySelectorAll('input:checked')).map(cb => cb.value);
    if (selectedCuisines.length > 0) params.set('categories', selectedCuisines.join(','));

    var activePrices = window._getActivePrices ? window._getActivePrices() : [];
    if (activePrices.length > 0 && activePrices.length < 4) params.set('price', activePrices.join(','));

    const dateVal = document.getElementById('filter-date').value;
    const timeVal = document.getElementById('filter-time').value;
    if (dateVal && timeVal) {
        const ts = Math.floor(new Date(dateVal + 'T' + timeVal).getTime() / 1000);
        if (ts > 0) params.set('open_at', ts);
    }

    try {
        const resp = await fetch('api/search.php?' + params.toString());
        const data = await resp.json();
        updateUsageFromResponse(data);
        if (!resp.ok) {
            showNotification(data.message || data.error || 'Search failed (' + resp.status + ')', 'error');
        } else {
            let results = data.results;

            // Cap displayed results at 10
            results = results.slice(0, 10);

            displayResults(results);
        }
    } catch (err) {
        showNotification('Network error: could not reach server.', 'error');
    } finally {
        isSearching = false;
        updateSearchButtonState();
    }
}

const searchBtnEl = document.getElementById('search-btn');
if (searchBtnEl) searchBtnEl.addEventListener('click', performSearch);

// Debug mode toggle
const debugBtn = document.getElementById('debug-btn');
function updateDebugBtn() {
    debugBtn.classList.toggle('active', debugMode);
    debugBtn.textContent = debugMode ? 'Debug ON' : 'Debug';
}
updateDebugBtn();
debugBtn.addEventListener('click', function () {
    debugMode = !debugMode;
    localStorage.setItem('eatout_debug', debugMode ? '1' : '0');
    updateDebugBtn();
    showNotification(debugMode ? 'Debug mode ON \u2014 search uses mock data' : 'Debug mode OFF \u2014 search uses real API', 'info');
});

// Map init
const map = L.map('map', { zoomControl: false }).setView([43.6532, -79.3832], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
L.control.zoom({ position: 'bottomright' }).addTo(map);

map.doubleClickZoom.enable();

window.addEventListener('resize', function () { map.invalidateSize(); updatePanelTop(); });

// Radius dropdown in filter bar
const RADIUS_PRESETS = [
    { label: '500m', value: 500 },
    { label: '750m', value: 750 },
    { label: '1km', value: 1000 },
    { label: '1.5km', value: 1500 },
    { label: '2km', value: 2000 },
    { label: '5km', value: 5000 }
];

function setRadius(value) {
    selectedRadius = value;
    // Update toggle button text
    var toggleBtn = document.getElementById('radius-toggle');
    var preset = RADIUS_PRESETS.find(function(p) { return p.value === value; });
    if (toggleBtn && preset) {
        var label = toggleBtn.querySelector('.filter-label');
        if (label) label.textContent = preset.label;
        toggleBtn.classList.add('filter-active');
    }
    // Update active state in dropdown
    document.querySelectorAll('.radius-opt').forEach(function(b) {
        b.classList.toggle('active', parseInt(b.dataset.value) === value);
    });
    if (currentCircle) {
        currentCircle.setRadius(selectedRadius);
    }
    if (radarMarker && pinLat !== null) {
        updateRadar(pinLat, pinLng);
    }
    updateUrlHash();
}

// Radius dropdown toggle
(function() {
    var toggle = document.getElementById('radius-toggle');
    var dropdown = document.getElementById('radius-dropdown');

    toggle.addEventListener('click', function(e) {
        e.stopPropagation();
        var isOpen = dropdown.classList.contains('open');
        closeAllDropdowns();
        if (!isOpen) dropdown.classList.add('open');
    });

    document.querySelectorAll('.radius-opt').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            setRadius(parseInt(btn.dataset.value));
            dropdown.classList.remove('open');
            saveFiltersToSession();
        });
    });

    // Init active state
    setRadius(selectedRadius);

    // Outside click to close
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.radius-wrapper')) {
            dropdown.classList.remove('open');
        }
    });
})();

// Place or move pin
let pinInstructionDismissed = false;

function getCirclePixelRadius() {
    if (!currentCircle) return 48;
    var earthRadius = 6378137;
    var latRad = currentCircle.getLatLng().lat * Math.PI / 180;
    var dLng = (selectedRadius / (earthRadius * Math.cos(latRad))) * (180 / Math.PI);
    var center = map.latLngToContainerPoint(currentCircle.getLatLng());
    var edge = map.latLngToContainerPoint(
        L.latLng(currentCircle.getLatLng().lat, currentCircle.getLatLng().lng + dLng)
    );
    return Math.abs(edge.x - center.x);
}

function updateRadar(lat, lng) {
    var pixelRadius = getCirclePixelRadius();
    var size = pixelRadius * 2;
    var html = '<div class="radar-container" style="width:' + size + 'px;height:' + size + 'px;">';
    for (var i = 0; i < 3; i++) {
        html += '<div class="radar-ring" style="width:' + size + 'px;height:' + size + 'px;"></div>';
    }
    html += '</div>';

    if (radarMarker) {
        map.removeLayer(radarMarker);
    }

    var radarIcon = L.divIcon({
        className: '',
        html: html,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
    radarMarker = L.marker([lat, lng], { icon: radarIcon, interactive: false, zIndexOffset: -1000 }).addTo(map);
}

// Show pin search popup — below pin, no arrow
function showPinSearchPopup(lat, lng) {
    if (pinSearchPopup) {
        map.closePopup(pinSearchPopup);
    }
    pinSearchPopup = L.popup({
        className: 'pin-search-popup',
        closeButton: false,
        offset: [0, 85],
        autoPan: false
    })
    .setLatLng([lat, lng])
    .setContent('<button class="btn-primary pin-search-btn" onclick="performSearch()">Search</button>')
    .openOn(map);
}

function placePin(lat, lng) {
    if (currentMarker) {
        map.removeLayer(currentMarker);
        map.removeLayer(currentCircle);
    }
    if (radarMarker) {
        map.removeLayer(radarMarker);
    }
    pinLat = lat;
    pinLng = lng;

    currentCircle = L.circle([lat, lng], {
        radius: selectedRadius,
        color: '#2358DA',
        fillColor: '#2358DA',
        fillOpacity: 0.08,
        weight: 2
    }).addTo(map);

    var pinIcon = L.divIcon({
        className: '',
        html: '<div class="pin-dot"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
    });
    currentMarker = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);
    var dragTarget = null;
    var dragAnimId = null;
    var circlePos = null;
    function lerpDrag() {
        if (!dragTarget || !circlePos) return;
        circlePos.lat += (dragTarget.lat - circlePos.lat) * 0.3;
        circlePos.lng += (dragTarget.lng - circlePos.lng) * 0.3;
        currentCircle.setLatLng([circlePos.lat, circlePos.lng]);
        if (radarMarker) radarMarker.setLatLng([circlePos.lat, circlePos.lng]);
        var dist = Math.abs(dragTarget.lat - circlePos.lat) + Math.abs(dragTarget.lng - circlePos.lng);
        if (dist > 1e-8) {
            dragAnimId = requestAnimationFrame(lerpDrag);
        } else {
            currentCircle.setLatLng([dragTarget.lat, dragTarget.lng]);
            if (radarMarker) radarMarker.setLatLng([dragTarget.lat, dragTarget.lng]);
            dragAnimId = null;
        }
    }
    currentMarker.on('dragstart', function () {
        var pos = currentMarker.getLatLng();
        circlePos = { lat: pos.lat, lng: pos.lng };
        if (pinSearchPopup) {
            var el = pinSearchPopup.getElement();
            if (el) { el.style.transition = 'opacity 0.15s'; el.style.opacity = '0'; }
        }
    });
    currentMarker.on('drag', function (e) {
        var pos = e.target.getLatLng();
        dragTarget = { lat: pos.lat, lng: pos.lng };
        if (pinSearchPopup) pinSearchPopup.setLatLng(pos);
        if (!dragAnimId) dragAnimId = requestAnimationFrame(lerpDrag);
    });
    currentMarker.on('dragend', function (e) {
        const pos = e.target.getLatLng();
        dragTarget = { lat: pos.lat, lng: pos.lng };
        if (!dragAnimId) dragAnimId = requestAnimationFrame(lerpDrag);
        updatePin(pos.lat, pos.lng);
        if (pinSearchPopup) {
            var el = pinSearchPopup.getElement();
            if (el) { el.style.transition = 'opacity 0.15s'; el.style.opacity = '1'; }
        }
    });
    currentMarker.on('mouseover', function () {
        var el = currentMarker.getElement();
        if (el) {
            var dot = el.querySelector('.pin-dot');
            if (dot) { dot.classList.remove('bounce-out'); dot.classList.add('bounce-in'); }
        }
        if (currentCircle) {
            var pathEl = currentCircle.getElement();
            if (pathEl) {
                pathEl.style.transition = 'stroke-width 0.2s ease';
                pathEl.style.strokeWidth = '4';
            }
        }
    });
    currentMarker.on('mouseout', function () {
        var el = currentMarker.getElement();
        if (el) {
            var dot = el.querySelector('.pin-dot');
            if (dot) { dot.classList.remove('bounce-in'); dot.classList.add('bounce-out'); }
        }
        if (currentCircle) {
            var pathEl = currentCircle.getElement();
            if (pathEl) {
                pathEl.style.strokeWidth = '2';
            }
        }
    });

    updateRadar(lat, lng);
    showPinSearchPopup(lat, lng);

    updateSearchButtonState();
    updateUrlHash();

    if (!pinInstructionDismissed) {
        pinInstructionDismissed = true;
        var instruction = document.getElementById('pin-instruction');
        if (instruction) {
            instruction.classList.add('hidden');
            setTimeout(function() { instruction.remove(); }, 500);
        }
    }
}

function updatePin(lat, lng) {
    pinLat = lat;
    pinLng = lng;
    currentCircle.setLatLng([lat, lng]);
    updateRadar(lat, lng);
    showPinSearchPopup(lat, lng);
    updateSearchButtonState();
    updateUrlHash();
}

map.on('zoomend', function() {
    if (radarMarker && pinLat !== null) {
        updateRadar(pinLat, pinLng);
    }
});

let justClosedPopup = false;
map.on('popupclose', function(e) {
    // Only block pin placement when a result marker popup closes, not the pin search popup
    if (e.popup === pinSearchPopup) return;
    justClosedPopup = true;
    setTimeout(function() { justClosedPopup = false; }, 10);
});

map.on('click', function (e) {
    if (justClosedPopup) return;
    if (anyDropdownOpen()) {
        closeAllDropdowns();
        return;
    }
    placePin(e.latlng.lat, e.latlng.lng);
});

// Pin instruction overlay
var pinInstruction = document.createElement('div');
pinInstruction.id = 'pin-instruction';
pinInstruction.textContent = isTouch ? 'Tap to drop a pin' : 'Click to drop a pin';
document.getElementById('map').appendChild(pinInstruction);

// Read URL hash or fall back to geolocation
var hashState = readUrlHash();
if (hashState) {
    selectedRadius = hashState.r;
    document.querySelectorAll('.radius-btn').forEach(function(b) {
        b.classList.toggle('active', parseInt(b.dataset.value) === selectedRadius);
    });
    map.setView([hashState.lat, hashState.lng], 13);
    placePin(hashState.lat, hashState.lng);
} else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 13);
        placePin(lat, lng);
    });
}

// Bottom sheet touch handling
(function() {
    var handle = document.getElementById('bottom-sheet-handle');
    var panel = document.getElementById('results-panel');
    var touchStartY = 0;
    var startTranslateY = 0;
    var dragging = false;

    function getCurrentTranslateY() {
        var h = panel.offsetHeight;
        switch (bottomSheetState) {
            case 'collapsed': return h - 48;
            case 'half': return window.innerHeight * 0.35;
            case 'full': return 0;
            default: return h;
        }
    }

    handle.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        startTranslateY = getCurrentTranslateY();
        dragging = true;
        panel.style.transition = 'none';
    }, { passive: true });

    handle.addEventListener('touchmove', function(e) {
        if (!dragging) return;
        var deltaY = e.touches[0].clientY - touchStartY;
        var newY = Math.max(0, Math.min(panel.offsetHeight - 48, startTranslateY + deltaY));
        panel.style.transform = 'translateY(' + newY + 'px)';
    }, { passive: true });

    handle.addEventListener('touchend', function(e) {
        if (!dragging) return;
        dragging = false;
        panel.style.transition = 'transform 0.3s ease';
        var endY = e.changedTouches[0].clientY;
        var deltaY = endY - touchStartY;

        if (Math.abs(deltaY) < 12) {
            setBottomSheetTransform(true);
            return;
        }

        if (deltaY > 48) {
            if (bottomSheetState === 'full') bottomSheetState = 'half';
            else if (bottomSheetState === 'half') bottomSheetState = 'collapsed';
        } else if (deltaY < -48) {
            if (bottomSheetState === 'collapsed') bottomSheetState = 'half';
            else if (bottomSheetState === 'half') bottomSheetState = 'full';
        }
        setBottomSheetTransform(true);
    });

    handle.addEventListener('click', function() {
        if (bottomSheetState === 'collapsed') bottomSheetState = 'half';
        else bottomSheetState = 'collapsed';
        setBottomSheetTransform(true);
    });
})();

// Global keyboard handler
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        // Close radius dropdown
        var radiusDD = document.getElementById('radius-dropdown');
        if (radiusDD && radiusDD.classList.contains('open')) {
            radiusDD.classList.remove('open');
            document.getElementById('radius-toggle').focus();
            return;
        }
        // Close price dropdown
        var priceDD = document.getElementById('price-dropdown');
        if (priceDD && priceDD.classList.contains('open')) {
            priceDD.classList.remove('open');
            document.getElementById('price-toggle').focus();
            return;
        }
        // Close date dropdown
        var dateDD = document.getElementById('date-dropdown');
        if (dateDD && dateDD.classList.contains('open')) {
            dateDD.classList.remove('open');
            document.getElementById('date-toggle').focus();
            return;
        }
        // Close time dropdown
        var timeDD = document.getElementById('time-dropdown');
        if (timeDD && timeDD.classList.contains('open')) {
            timeDD.classList.remove('open');
            document.getElementById('time-toggle').focus();
            return;
        }
        // Close cuisine dropdown
        if (cuisineDropdown.classList.contains('open')) {
            cuisineDropdown.classList.remove('open');
            document.getElementById('cuisine-toggle').focus();
            return;
        }
        // Collapse bottom sheet on mobile
        if (isMobile() && panelOpen && bottomSheetState !== 'collapsed') {
            bottomSheetState = 'collapsed';
            setBottomSheetTransform(true);
            return;
        }
    }

    // Focus trap in cuisine dropdown
    if (e.key === 'Tab' && cuisineDropdown.classList.contains('open')) {
        var focusable = cuisineDropdown.querySelectorAll('input[type="checkbox"]');
        if (focusable.length === 0) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
});

// Swoop in filter bar after page load, then start resize observer
(function() {
    var bar = document.getElementById('filter-bar');
    setTimeout(function() {
        bar.classList.add('swooped-in');

        // Start resize bounce observer after swoop-in finishes
        var lastWidth = bar.offsetWidth;
        var observer = new ResizeObserver(function(entries) {
            var newWidth = entries[0].contentRect.width;
            if (lastWidth > 0 && Math.abs(newWidth - lastWidth) > 2) {
                var ratio = lastWidth / newWidth;
                bar.animate([
                    { transform: 'translateX(-50%) scaleX(' + ratio + ')' },
                    { transform: 'translateX(-50%) scaleX(1)' }
                ], {
                    duration: 400,
                    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                });
            }
            lastWidth = newWidth;
        });
        // Delay observer start until transition completes
        setTimeout(function() { observer.observe(bar); }, 700);
    }, 1200);
})();

// Panel starts hidden — only shown when search returns results
