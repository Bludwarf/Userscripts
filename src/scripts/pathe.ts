// ==UserScript==
// @description  Ajout de filtre pour la liste des films du cinéma Pathé
// @match        https://www.pathe.fr/cinemas/*
// @icon         https://www.pathe.fr/assets/custom/icons/favicon-32.png
// @grant        GM_addStyle
// ==/UserScript==

// Les films sont chargés au démarrage
// Les séances sont chargés (async) lorsqu'un film est visible

const filmDivList = document.querySelectorAll('[class="tw:group"]');

(async function main() {
    const allShowtimes: ShowtimeJson[] = [];

    for (const filmDiv of filmDivList) {
        addDeleteButtonFor(filmDiv);
        const showId = getShowId(filmDiv);
        const showtimes = await fetchShowtimesOf(showId);
        allShowtimes.push(...showtimes);
    }

    const sortedShowtimes = allShowtimes.sort((showtimeA, showtimeB) => showtimeA.time.localeCompare(showtimeB.time));
    console.log(sortedShowtimes)

    const schedule = document.getElementById("cinema-schedule");
    schedule.insertAdjacentHTML("beforebegin", `
    <label for="minShowtime">Début :</label><br />
<input type="range" id="minShowtimeInput" name="minShowtimeInput" list="showtimes" min="15" value="15" max="22" />
<output id="minShowtimeOutput"></output>
<datalist id="showtimes">
  <option value="15"></option>
  <option value="16"></option>
  <option value="17"></option>
  <option value="18"></option>
  <option value="19"></option>
  <option value="20"></option>
  <option value="21"></option>
  <option value="22"></option>
</datalist>
    `)
    GM_addStyle(`
input[type="range"] {
  width: 200px;
}
    `)
    const value = document.querySelector("#minShowtimeOutput") as HTMLOutputElement;
    const input = document.querySelector("#minShowtimeInput") as HTMLInputElement;
    value.textContent = input.value;
    input.addEventListener("input", (event) => {
        const minHourString = (event.target as HTMLInputElement).value;
        value.textContent = minHourString;

        const minHour = Number(minHourString);
        const filteredShowtimes = sortedShowtimes.filter(showtime => showtime.time >= `2026-10-25 ${minHour}:00:00`);
        console.log(filteredShowtimes);
    });
})();

function getShowId(filmDiv: Element): string {
    const link = filmDiv.querySelector("h2").parentElement as HTMLAnchorElement;
    return link.href.substring(link.href.lastIndexOf("/") + 1);
}

async function fetchShowtimesOf(showId: string): Promise<ShowtimeJson[]> {
    const response = await fetch(`https://www.pathe.fr/api/show/${showId}/showtimes/cinema-pathe-rennes/2026-10-25?language=fr`)
    if (response.ok) {
        return await response.json() as ShowtimeJson[];
    } else {
        return [];
    }
}


/* Exemple :
{
  "time": "2026-10-25 17:10:00",
  "version": "vost",
  "tags": [
  	"DEFAULT",
  	"GRETA",
  	"pmr"
  ],
  "status": "available",
  "reservabilityStart": "2025-09-22T09:52:44+02:00",
  "reservabilityEnd": "2026-10-25T17:30:00+01:00",
  "isMovie": true,
  "refCmd": "https://s.pathe.fr/fr/V3351S159729/booking",
  "auditoriumName": "8",
  "auditoriumCapacity": "130",
  "endTime": "2026-10-25 19:03:00",
  "specialShowtimeDetails": null
}
 */
interface ShowtimeJson {
    time: string;
}

function addDeleteButtonFor(filmDiv: Element): void {
    const existingButton = filmDiv.querySelector('button[type="button"][data-disabled="false"]');

    const button = existingButton.cloneNode(true) as HTMLButtonElement;
    button.style.setProperty("color", "red", "important");
    button.querySelector('span').innerText = "Masquer";
    removeElement(button.querySelector('cgp-icon')); // TODO en attendant de trouver une icône adéquate
    button.addEventListener("click", (e) => {
        filmDiv.parentElement.removeChild(filmDiv);
    })

    existingButton.parentElement.appendChild(button);
}

function removeElement(el: Element): void {
    el.parentNode.removeChild(el);
}
