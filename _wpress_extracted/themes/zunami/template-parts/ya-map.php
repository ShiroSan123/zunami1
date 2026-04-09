<script src="https://api-maps.yandex.ru/v3/?apikey=<?= $args['apikey'] ?>&lang=ru_RU"></script>
<div id="ya-map" class="ya-map-holder"></div>
<script>
	document.addEventListener("DOMContentLoaded", () => {
		async function initMap() {
		    await ymaps3.ready;
		    const {YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker} = ymaps3;
		    const map = new YMap(
		        document.getElementById('ya-map'),
		        {
		            location: {
		                center: [<?= $args['lon'] ?>, <?= $args['lat'] ?>],
		                zoom: <?= $args['zoom'] ?? 14 ?>
		            }
		        },
				[
					new YMapDefaultSchemeLayer({customization:[
						{
							stylers: [
								{
									saturation: -1
								}
							]
						}
					]}),
					new YMapDefaultFeaturesLayer({})
				]
		    );
			const markerElement = document.createElement('div');
			markerElement.className = 'ya-map-marker';

			const marker = new YMapMarker(
			  {
			    coordinates: [<?= $args['lon'] ?>, <?= $args['lat'] ?>],
			    draggable: false,
			    mapFollowsOnDrag: false
			  },
			  markerElement
			);		    

		    map.addChild(marker);
		}

		initMap();
	})


</script>	