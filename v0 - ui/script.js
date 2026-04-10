$(document).ready(function () {

    if ($("#waves").length != 0) {
        init_waves();
    }

});

function init_waves() {
	

    var waves = $("#waves");
    var elHeight = $(waves).innerHeight();
    var winHeight = $(window).innerHeight();
    var wavesMaxHeight = elHeight * 5;
    var wavesBefore = $("#waves_placeholder_before");
    var wavesAfter = $("#waves_placeholder_after");
    var lastScrollTop = 0;
    winHeight = elHeight;

    
    let wvHeight = $("#waves_line").innerHeight();
    let wavePeriod = wvHeight/80*130;

    placeholderAfterHeight(wavesMaxHeight - elHeight);

    $(window).on('scroll', function () {
        
        var st = $(this).scrollTop();
        console.log("The document is being scrolled!");
        let offsetTopBefore = $(wavesBefore).offset().top;
        let scrollPos = $(window).scrollTop();
        let scrolled = offsetTopBefore - scrollPos;
       
        if (scrolled<0 && Math.abs(scrolled)<wavesMaxHeight - elHeight) {
            console.log("setPersentage");
            setPersentage(Math.round(Math.abs(scrolled * 100/(wavesMaxHeight - elHeight)), 2)/100);
        }

        let wavesBeforeBottomPosition = offsetTopBefore - scrollPos + $(wavesBefore).innerHeight() - winHeight;
        if (st > lastScrollTop) {
            if (scrolled <= 0 && (wavesBeforeBottomPosition > 0 || $(wavesBefore).innerHeight() == 0) && !$(waves).hasClass("fixed")) {
                placeholderBeforeHeight(wavesMaxHeight);
                $(waves).addClass("fixed");
                placeholderAfterHeight(0);
                setPersentage(0);
            }
            else if (scrolled > 0) {
                placeholderBeforeHeight(0);
                $(waves).removeClass("fixed");
                placeholderAfterHeight(wavesMaxHeight - elHeight);
                setPersentage(0);
            }

            let offsetTopAfter = $(wavesAfter).offset().top;
            let scrolledAfter = offsetTopAfter - scrollPos;
            if (scrolledAfter < winHeight) {
                $(waves).removeClass("fixed");
                placeholderBeforeHeight(wavesMaxHeight - elHeight);
            }
        } else {
            let offsetTopAfter = $(wavesAfter).offset().top;
            let scrolledAfter = offsetTopAfter - scrollPos;
            if (scrolledAfter> winHeight && scrolled<=0  && !$(waves).hasClass("fixed")) {                
                placeholderBeforeHeight(wavesMaxHeight);
                $(waves).addClass("fixed");
                placeholderAfterHeight(0);
                
                setPersentage(1);
            } else {
                if (scrolled>0) {
                    placeholderBeforeHeight(0);
                    $(waves).removeClass("fixed");
                    placeholderAfterHeight(wavesMaxHeight - elHeight);
                    
                    setPersentage(0);
                }
            }
        }
        lastScrollTop = st;     
    });
    $(window).on('wheel', function (event) {
        //console.log(event);
    });
    function placeholderBeforeHeight(h) {
        $(wavesBefore).css("height", h + "px");
    }
    function placeholderAfterHeight(h) {
        $(wavesAfter).css("height", h + "px");
    }
    function setPersentage(state) {
        let cnt = $(waves).find(".info_itm").length;
        let step = 1.0/cnt; 
        $(waves).find(".info_itm").each(function(i){
            if (i * step <= state) {
                if ((i+1) * step > state) {
                    let op = (state - i * step)/step;
                    $(this).css("opacity", op);
                }
                else {
                    $(this).css("opacity", 1);
                }
            } else {
                $(this).css("opacity", 0);
            } 
        });
        let vawesOffset = (-state*100 * 20);
        $("#waves_line").css("background-position", vawesOffset+"px");
        
        let wavePeriodPos = (Math.abs(vawesOffset - 30 - $("#waves_line").width()*0.2) % wavePeriod) / wavePeriod;
        let hghtOffset = 0.5 - Math.abs(0.5 - wavePeriodPos);
        let pixOffset = wvHeight * 0.6 * Math.floor(hghtOffset*10)/10;
        $("#swimmer").css("background-position-y", (pixOffset) + "px");

    }
}