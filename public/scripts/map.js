var tiles = L.tileLayer(`maptiles/{z}/{x}/{y}.png`, {});
   
var map = L.map('map', {
    crs: L.CRS.Simple,
    layers: [tiles],
    minZoom: 3,
    maxZoom: 5,
    center: [-56, 100],
    zoom: 1,
    zoomDelta: 1,
    wheelPxPerZoomLevel: 128
});

map.setMaxBounds([
    [10,-10],
    [-130, 235]
])

var sidebar = L.control.sidebar('sidebar').addTo(map)


// Declaring the basic functions
var animateLeftLeave;
var animateRightLeave;

// Declaring all of our country functions
var countryDataList;
var countryClicked;
var displayCountryData;
var countryAnimation;
var countryBack;
var updateProperties;

// Declaring all of our god functions
var godsList;
var godValue;
var godsClicked;
var godsBack;

async function setup() {

    animateLeftLeave = function(left, right) {
        left.classList.add("animate__fadeOutLeft")
        left.addEventListener("animationend", () => {
            left.classList.remove("animate__fadeOutLeft")
            left.hidden = true

            right.hidden = false
            right.classList.add("animate__fadeInRight")
            right.addEventListener("animationend",() => {right.classList.remove("animate__fadeInRight")}, {once:true})
        }, {once: true})
    }

    animateRightLeave = function(left, right) {
        right.classList.add("animate__fadeOutRight");

        right.addEventListener("animationend", () => {
            right.classList.remove("animate__fadeOutRight")
            right.hidden = true

            left.hidden = false
            left.classList.add("animate__fadeInLeft")
            left.addEventListener("animationend",() => {left.classList.remove("animate__fadeInLeft")}, {once:true})
        }, {once: true})
    }

    updateProperties = function(i) {
        var oderaProperties = window.localStorage.getItem("odera-props")
        if (oderaProperties !== null) {
            oderaProperties = oderaProperties.split(",")
            if (oderaProperties[i] === "show")
                oderaProperties[i] = ""
            else
                oderaProperties[i] = "show"
            console.log(oderaProperties)
            oderaProperties = oderaProperties.join()
            window.localStorage.setItem("odera-props", oderaProperties)
        }
    }
    
    await fetch('/countries.json', {method: 'GET'})
    .then(function(response) { return response.json(); })
    .then(function(json) {
        countries = json

        // Setting up the html
        document.getElementById('countries').innerHTML = `
            <h1 class="sidebar-header">
                Countries
            <span class="sidebar-close"><i class="fa fa-caret-left"></i></span>
            </h1>
            <p class="lorem mt-3">${countries.intro}</p>
            <hr>`

        var countryListDiv = document.createElement('div')
        countryListDiv.classList = "animate__animated"
        countryListDiv.innerHTML = `<h5>${countries.desc}</h5>`

        var countryList = document.createElement('ul')
        countryList.classList = "countries-list"
        for (var i = 0; i < countries.length; i++) (function (i) {
            var listItem = document.createElement('li')
            listItem.innerHTML = `<a href="#${countries[i].name.toLowerCase().split(" ").join("-")}" onclick='countryClicked(${i}, false, -1)' >${countries[i].name}</a>`
            countryList.appendChild(listItem)
        })(i)
        countryListDiv.appendChild(countryList)
        document.getElementById('countries').appendChild(countryListDiv)

        document.getElementById('countries').innerHTML += `
            <div hidden class="animate__animated" id="country"></div>
            <div hidden class="animate__animated" id="city"></div>`

        const mapList = document.getElementById("countries").getElementsByTagName("div")[0]
        const countryValue = document.getElementById("countries").getElementsByTagName("div")[1]
        const cityValue = document.getElementById("countries").getElementsByTagName("div")[2]
        mapList.style.setProperty('--animate-duration', '0.2s')
        countryValue.style.setProperty('--animate-duration', '0.2s')
        cityValue.style.setProperty('--animate-duration', '0.2s')
            

        let countriesWithCities = []
        for (var i = 0; i < countries.length; i++) (function(i) {
            let latlngs = []
            for (var j = 0; j < countries[i].latlngs.length; j++) {
                latlngs[j] = JSON.parse(countries[i].latlngs[j])
            }
            var country = L.polygon(latlngs, {color: 'blue', opacity: 0, fillOpacity: 0})
            country.on('click', function () {
                countryClicked(i, true, -1)
            })
            country.addTo(map)

            if (countries[i].cities.length != 0) {
                let index = countriesWithCities.length
                countriesWithCities[index] = []
                countriesWithCities[index][0] = country
                countriesWithCities[index][1] = []
                for (var j = 0; j < countries[i].cities.length; j++) (function(j) {
                    var latlng = JSON.parse(countries[i].cities[j].latlng)
                    var city = L.polygon(latlng, {color: 'red', opacity: 0, fillOpacity: 0})
                    city.on('click', function() {
                        countryClicked(i, true, j)
                    })
                    countriesWithCities[index][1][j] = city
                })(j)
            }
        })(i)

        let lastZoom = map.getZoom()
        map.on('zoomend', function () {
            let zoom = map.getZoom()
            if (zoom === 5) {
                for (var i = 0; i < countriesWithCities.length; i++) {
                    countriesWithCities[i][0].remove()
                    for (var j = 0; j < countriesWithCities[i][1].length; j++) {
                        countriesWithCities[i][1][j].addTo(map)
                    }
                }
            } else if (zoom === 4 && lastZoom === 5) {
                for (var i = 0; i < countriesWithCities.length; i++) {
                    countriesWithCities[i][0].addTo(map)
                    for (var j = 0; j < countriesWithCities[i][1].length; j++) {
                        countriesWithCities[i][1][j].remove()
                    }
                }
            }
            lastZoom = zoom
        })

        countryClicked = function(index, fromMap, cityIndex) {
            // Need to clean up the logic in this function to have presets for Odera to kep elements shown or not
            // as weel as only rewritting the country if needed to enforce these presets (or just enforce them in displayCountryData)
            // (countries[index].name !== countryValue.getElementsByTagName('h3')[0].innerHTML) || 

            if (!fromMap || !mapList.hidden || cityIndex !== -1) {
                displayCountryData(index)
                var endUrl;
                if (cityIndex !== -1) {
                    endUrl = countries[index].cities[cityIndex].name.toLowerCase().split(" ").join("-")
                    cityValue.innerHTML = `<p><a href='#${countries[index].name.toLowerCase().split(" ").join("-")}' onclick="countryBack(1, 2);">Back to ${countries[index].name}</a></p>
                                        <h3>${countries[index].cities[cityIndex].name}</h3>
                                        <p>${countries[index].cities[cityIndex].desc}</p>`
                    if (mapList.hidden) {
                        // This means we are currently on the city or country page
                        countryAnimation(countryValue, cityValue, fromMap)
                    } else {
                        countryAnimation(mapList, cityValue, fromMap)
                    }
                    map.setView(JSON.parse(countries[index].cities[cityIndex].center), 5)
                } else {
                    endUrl = countries[index].name.toLowerCase().split(" ").join("-")
                    if (!cityValue.hidden) {
                        countryBack(countryValue, cityValue, fromMap)
                    } else {
                        countryAnimation(mapList,countryValue, fromMap)
                    }

                    if (!fromMap)
                        map.setView(JSON.parse(countries[index].center), 4)
                }
                window.location.href = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/#${endUrl}`
            } else if (fromMap) { // This happens if the current country that is clicked on is from the map and a city is loaded
                displayCountryData(index)
                window.location.href = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/#${countries[index].name.toLowerCase().split(" ").join("-")}`
                if (cityValue.hidden)
                    countryAnimation(mapList, countryValue, fromMap)
                else
                    countryBack(countryValue, cityValue)
            }
        }

        displayCountryData = function(index) {
            countryValue.innerHTML = `<p><a href='#countries' onclick="countryBack(0, 1);">Back to Regions List</a></p>`
            if (countries[index].name === "Odera") {
                if (window.localStorage.getItem("odera-props") === null) {
                    window.localStorage.setItem("odera-props", "show,show,show")
                }
                const oderaProperties = window.localStorage.getItem("odera-props").split(",")
                countryValue.innerHTML += `<h3>${countries[index].name}</h3>`
                for (var i = 0; i < countries[index].desc.length; i++) (function(i) {
                    if (countries[index].desc[i].type === "text") {
                        countryValue.innerHTML += `<a data-bs-toggle="collapse" onclick="updateProperties(${0})" href="#history-desc" role="button" aria-expanded="false" aria-controls="history-desc">
                                                    <h5>${countries[index].desc[i].title}</h5></a>
                                                    `
                        let group = `<div class="collapse ${oderaProperties[0]}" id="history-desc">`
                        for (var j = 0; j < countries[index].desc[i].text.length; j++) {
                            group += `<p class="mx-3">${countries[index].desc[i].text[j]}</p>`
                        }
                        group += `</div>`
                        countryValue.innerHTML += group
                    } else { // type === "list"
                        countryValue.innerHTML += `<a data-bs-toggle="collapse" onclick="updateProperties(${1})" href="#government-desc" role="button" aria-expanded="false" aria-controls="government-desc">
                            <h5>${countries[index].desc[i].title}</h5></a>`
                        let list = `<div class="collapse ${oderaProperties[1]}" id="government-desc"><ul>`
                        for (var j = 0; j < countries[index].desc[i].list.length; j++) (function(j) {
                            list += `<li><a href='#${countries[index].desc[i].list[j].title.toLowerCase().split(" ").join("-")}' onclick="countryDataList(${index}, ${i}, ${j}, false)">${countries[index].desc[i].list[j].title}</a></li>`
                        })(j)
                        list += `</ul></div>`
                        countryValue.innerHTML += list
                    }
                })(i)
                // creates the list of cities
                if (countries[index].cities.length > 0) {
                    countryValue.innerHTML += `<a data-bs-toggle="collapse" onclick="updateProperties(${2})" href="#cities-desc" role="button" aria-expanded="false" aria-controls="cities-desc">
                                                <h5>Cities</h5></a>`
                    let list = `<div class="collapse ${oderaProperties[2]}" id="cities-desc"><ul>`
                    for (var i = 0; i < countries[index].cities.length; i++) (function(i) {
                        list += `<li><a href="#${countries[index].cities[i].name.toLowerCase().split(" ").join("-")}" onclick="countryClicked(${index}, true, ${i})" >${countries[index].cities[i].name}</a></li>`
                    })(i)
                    list += `</ul></div>`
                    countryValue.innerHTML += list
                }
            } else {    // all but odera go to this point
                countryValue.innerHTML += `<h3>${countries[index].name}</h3>
                                            <p>${countries[index].desc}</p>`
            }
        }

        countryDataList = function(countryIndex, descIndex, listIndex, fromStart) {
            cityValue.innerHTML = `<p><a href="#${countries[countryIndex].name.toLowerCase().split(" ").join("-")}" onclick="countryBack(1, 2);">Back to ${countries[countryIndex].name}</a></p>
                                        <h3>${countries[countryIndex].desc[descIndex].list[listIndex].title}</h3>`
            if (fromStart) {
                displayCountryData(countryIndex)
            }
            if (countries[countryIndex].desc[descIndex].list[listIndex].picture !== undefined) {
                cityValue.innerHTML += `<img src="${countries[countryIndex].desc[descIndex].list[listIndex].picture}"></img>`
            }
            cityValue.innerHTML += `<p>${countries[countryIndex].desc[descIndex].list[listIndex].text}</p>`
            if (countryValue.hidden)
                countryAnimation(mapList, cityValue, true)
            else
                countryAnimation(countryValue, cityValue, false)
        }

        countryAnimation = function(left, right, fromMap) {
            sidebar.open("countries")
            if (document.getElementById("sidebar").classList.contains("collapsed")) {
                if (!left.hidden)
                    left.hidden = true
                if (right.hidden)
                    right.hidden = false
            } else if (fromMap && left.hidden) {
                right.classList.add("animate__fadeInRight")
                right.addEventListener("animationend",() => {right.classList.remove("animate__fadeInRight")}, {once:true})
            } else {
                animateLeftLeave(left, right)
            }
    }

        countryBack = function(left, right) {
            if (left === 0)
                left = mapList
            else if (left === 1)
                left = countryValue
            if (right === 1)
                right = countryValue
            else if (right === 2)
                right = cityValue
            animateRightLeave(left, right)
        }
    })

    await fetch('/gods.json', {method: 'GET'})
    .then(function(response) { return response.json(); })
    .then(function(json) {

        const godsData = json

        document.getElementById('gods').innerHTML = `
            <h1 class="sidebar-header">
                ${godsData.title}
                <span class="sidebar-close"><i class="fa fa-caret-left"></i></span>
            </h1>
            <p class="lorem mt-3">${godsData.creationMyth}</p>
            <hr>`

        var godsListDiv = document.createElement('div')
        godsListDiv.classList = "animate__animated"
        godsListDiv.innerHTML = `<h5>${godsData.desc}</h5>`

        var godsList = document.createElement('ul')
        godsList.classList = "gods-list"
        for (var j = 0; j < godsData.gods.length; j++) (function (j) {
            var listItem = document.createElement('li')
            listItem.innerHTML = `<a href='#${godsData.gods[j].name.toLowerCase()}' onclick='godsClicked(${j})' >${godsData.gods[j].name}</a>`
            godsList.appendChild(listItem)
        })(j)
        godsListDiv.appendChild(godsList)
        document.getElementById('gods').appendChild(godsListDiv)

        document.getElementById('gods').innerHTML += `<div hidden class="animate__animated"></div>`

        godsList = document.getElementById("gods").getElementsByTagName("div")[0]
        godValue = document.getElementById("gods").getElementsByTagName("div")[1]
        godValue.style.setProperty('--animate-duration', '0.2s')
        godsList.style.setProperty('--animate-duration', '0.2s')

        godsClicked = function(index) { 
            var associations = ""
            for (var k = 0; k < godsData.gods[index].associations.length; k++) {
                if (k + 1 === godsData.gods[index].associations.length) {
                    associations += `and ${godsData.gods[index].associations[k]}.`
                } else {
                    associations += `${godsData.gods[index].associations[k]}, `
                }
            }
            godValue.innerHTML = `<p><a href='#gods' onclick="godsBack();">Back to list of Gods and Goddesses</a></p>
                                    <h3>${godsData.gods[index].name}</h3>
                                    <p>The ${godsData.gods[index].type} of ${associations}</p>
                                    <img src="${godsData.gods[index].picture}">`

            
            if (document.getElementById("sidebar").classList.contains("collapsed")) {
                if (!godsList.hidden)
                    godsList.hidden = true
                if (godValue.hidden)
                    godValue.hidden = false
                sidebar.open("gods")
            } else if (godsList.hidden) {
                    godValue.classList.add("animate__fadeInRight")
                    godValue.addEventListener("animationend",() => {godValue.classList.remove("animate__fadeInRight")}, {once:true})
            } else {
                animateLeftLeave(godsList, godValue)
            }
        }

        godsBack = function() {
            animateRightLeave(godsList, godValue)
        }
    })

    var url = window.location.href
    if (url !== undefined) { // we need to find an anchor tag with this value
        // first, it manually checks for the two default options
        var tag = url.split("/")[url.split("/").length - 1]
        if (tag === "#gods") {
            sidebar.open("gods")
        } else if (tag === "#countries") {
            sidebar.open("countries")
        }
        else {
            const anchors = document.getElementsByTagName('a')
            for (var i = 0; i < anchors.length; i++) {
                // Issues: Doesn't currently have everything that could have called it; just the ones currently in-scope
                if (anchors[i].href === url) {
                    const anchorFunction = eval( anchors[i].getAttribute('onclick') )
                    break;
                }
            }
            if (document.getElementById("sidebar").classList.contains("collapsed")) {
                await fetch('/table.json', {method: 'GET'})
                .then(function(response) { return response.json(); })
                .then(function(json) {
                    for (var i = 0; i < json.list.length; i++) {
                        if (url.includes(json.list[i][0])) {
                            console.log(json.list[i][1])
                            const anchorFunction = eval( json.list[i][1] )
                            console.log(anchorFunction)
                            break;
                        }
                    }
                })
            }
        }
    }

}

setup()


/*
//  This code was used to record the borders of a country. It works by recording all the points the user has clicked at, then
//  draws a line between the newest two to show the boundaries being made. Once someone clicks the button, the recorded values
//  are printed into the console to be extracted and used inside my code.
//  (I could have put it directly into a file, but I don't plan to use 'fs' from node.js on this project)

let countryCoordsArray = []
let index = 0
function onMapClick(e) {
    countryCoordsArray[index] = [e.latlng.lat, e.latlng.lng]
    if (index != 0) {
        L.polyline([countryCoordsArray[index-1], countryCoordsArray[index]], {color: 'red'}).addTo(map)
    }
    index++;
}

map.on('click', onMapClick)

document.getElementById('record-btn').addEventListener("click", function () {
    let returnString = '['
    for (var j = 0; j < countryCoordsArray.length; j++) {
        if (j != 0) {
            returnString += ', '
        }
        returnString += `[${countryCoordsArray[j]}]`
    }
    returnString += ']'
    console.log(returnString)
})

function onMapClick(e) {
    console.log(`[${e.latlng.lat}, ${e.latlng.lng}]`)
}

map.on('click', onMapClick)
*/