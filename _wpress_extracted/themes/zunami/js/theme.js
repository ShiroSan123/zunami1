
document.getElementById("mobile_menu_open").addEventListener("click", evt => {
	document.getElementById("masthead").classList.toggle("menu-open");
})

document.getElementById("search_popup_open").addEventListener("click", evt => {
	document.getElementById("search_popup").classList.add("search-popup_open");
})
document.getElementById("search_form").addEventListener("submit", evt => {
	evt.preventDefault();
    try {
        fetch('/wp-admin/admin-ajax.php', {
            method: "POST", 
		    headers: {
		        "Content-Type": "application/x-www-form-urlencoded",
		    },
            body: 'action=search&s=' + encodeURI(document.getElementById("search_input").value)
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
				document.getElementById("search_popup_results").classList.add("search-popup-results_open");
				let searchResult = '<div class="search-res-count">Результатов: <strong>' + data.data.count + '</strong></div>';
				data.data.posts.forEach(post => {
					searchResult += '<a class="search-res-post" href="' + post.link + '">' + post.title + '</a>';
				})
				document.getElementById("search_popup_results_text").innerHTML = searchResult;
            });
    } finally {
        //
    }
})
document.getElementById("search_popup_close").addEventListener("click", evt => {
	document.getElementById("search_popup").classList.remove("search-popup_open");
	document.getElementById("search_popup_results").classList.remove("search-popup-results_open");
	document.getElementById("search_input").value = "";
})


let loadMoreBtn = document.getElementById("load_more_posts")
if (loadMoreBtn) {
	loadMoreBtn.addEventListener("click", evt => {
		const loadCount = 9;
		let posts = document.querySelectorAll("ARTICLE[data-is-hidden]");
		if (posts.length <= loadCount) {
			document.getElementById("load_more_posts").toggleAttribute("data-is-hidden", true);
		}
		Array.from(posts).slice(0, loadCount).forEach(post => post.toggleAttribute("data-is-hidden", false));	
	})
}

let accordionItems = document.querySelectorAll(".wp-block-accordion-item");
if (accordionItems) {
	accordionItems.forEach(e => e.querySelector(".wp-block-accordion-heading__toggle").addEventListener("click", evt => {
		accordionItems.forEach(item => {
			if (item != e) {
				item.classList.remove("is-open");
				e.querySelector(".wp-block-accordion-panel").toggleAttribute("inert", true);
			}
		})
	}))	
}


let requestFormPopup = document.querySelector('#modal_request');
let requestFormBtns = document.querySelectorAll('A[href="#main_popup"], BUTTON[data-href="#main_popup"], #open_main_popup');
if (requestFormBtns) {
	requestFormBtns.forEach(e => e.addEventListener("click", evt => {
		evt.preventDefault();
		requestFormPopup.classList.add("modal-open");
	}));
}
document.querySelectorAll(".modal-window").forEach(
	e => e.querySelector(".modal-background").addEventListener("click", evt => requestFormPopup.classList.remove("modal-open"))
);

let isInViewport = (item) => {
    var bounding = item.getBoundingClientRect(),
        myElementHeight = item.offsetHeight,
        myElementWidth = item.offsetWidth;

    if (bounding.top >= -myElementHeight
        && bounding.left >= -myElementWidth
        && bounding.right <= (window.innerWidth || document.documentElement.clientWidth) + myElementWidth
        && bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) + myElementHeight) {
        return true;
    }
    return false;
}


let animationElements = document.querySelectorAll("[animate-on-visible]:not(.in-viewport)");
let checkVPAnimation = evt => {
	let detected = false;
	if (animationElements) {
		animationElements.forEach(e => {
			if (isInViewport(e)) {
				e.classList.add("in-viewport"); 
				detected = true;
			}
		})		
	}
	if (detected) {
		animationElements = document.querySelectorAll("[animate-on-visible]:not(.in-viewport)");
	}
}
window.addEventListener("scroll", checkVPAnimation);
document.addEventListener("DOMContentLoaded", checkVPAnimation);
document.addEventListener("DOMContentLoaded", wpcf7_redirect_mailsent_handler);
