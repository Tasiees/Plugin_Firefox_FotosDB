
//Variables.

var tabID = 0;
var token = undefined;
var table_name = "";
var idapex = "";
var arrayFotos;
let globalArrayFotos = [];

//Declaració HTML.

var doc = "popup.html"


//Declaració Botons.
const botonURL = document.querySelector('#take-url');
const botonIMG = document.querySelector('#get-images');
const botonDWL = document.querySelector('#download_pics');


//Al descarregar Inici Sessió Per obtindre el token.
browser.runtime.onInstalled.addListener(function () {
  browser.tabs.create({ url: 'http://localhost:8080/user/login' });
});

//Obtenció del token.
browser.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  if (tab.url && tab.url.startsWith('http://localhost:8080/town') && changeInfo.status === 'complete') {
    console.log('Tab ' + tabId + ' is fully loaded.');
    tabID = tabId;
    browser.tabs.executeScript(tabId, { code: userToken.toString() + '; userToken();' }, function (result) {
      token = result[0].token;
      username = result[0].name;
      console.log("token", token);
      console.log("username", username);
      start_connection(tabId);
    });
  }
});

//Guardem el token al localStorage.
function userToken() {
  const userToken = JSON.parse(localStorage.getItem('user'));
  if (userToken && userToken.token) {
    browser.storage.local.set({ token: userToken.token });
    return userToken;
  }
}

//Boto que activa la funcio per obtindre la URL.
botonURL.addEventListener('click', function (event) {

  //Netejem les el array de qualsevol valor.
  globalArrayFotos = [];
  console.log("Clean de la variable Global");

  //Split de la url per obtindre la informacio per a fer el post.
  browser.tabs.query({ currentWindow: true, active: true })
    .then((tabs) => {
      URLactual = tabs[0].url;
      console.log(tabs[0].url);
      let segmentos = URLactual.split('/');
      table_name = segmentos[segmentos.length - 2];
      idapex = segmentos[segmentos.length - 1];

      //Com la url no es igual que la DB cambien els valors.
      if (table_name == "cable") {
        table_name = "Fo"
      } else if (table_name == "distributionpoint") {
        table_name = "Distributionpoint"
      } else if (table_name == "splicebox") {
        table_name = "Splicebox"
      }

      //Printem al html la informacio sobre la que estem buscant les dades.
      const message = document.querySelector('p');
      message.textContent = (table_name + "     |       " + idapex);
      message.style.textAlign = "center";
      message.style.fontWeight = "bold";

      //Cridem la funcio per a fer la consulta al backend.
      hacerConsultaAlBackend(idapex, table_name);

    })
});


async function hacerConsultaAlBackend(idapex, table_name) {
  try {

    //Activem Gif de loading.
    document.getElementById("loadingMessage").style.display = "block";


    //Consulta POST.
    const response = await fetch('http://localhost:8080/fwnet/download/photos/element/', {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': '/*URL del BACK*/',
        'authorization': '/*TOKEN*/',
        'Content-Type': 'application/json',
        'Origin': '/*URL del BACK*/',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'TE': 'trailers'
      },
      body: JSON.stringify({ id_apex: idapex, table_name: table_name })
    });
    //Deixem un temps de marge de seguretat al Backend per enviar i printar la consulta.
    const responseJson = await Promise.race([
      response.json().catch(error => {
        throw new Error('Error al convertir la resposta a formato JSON: ' + error.message);
      }),
      new Promise((_, reject) => setTimeout(() => reject(console.log('Temps de espera agotat')), 35000))
    ]);

    //Guardem els valors que ens retorna el Backend a un array.
    const arrayFotos = responseJson;
    globalArrayFotos = arrayFotos;
    console.log("arrayFotos guardat a la variable 'globalArrayFotos'");
    console.log(globalArrayFotos);

    //Si el POST no es completa correctament Alert i desactivem el loading.
    if (globalArrayFotos.error === "Error al obtenir les imatges de la base de dades") {

      alert("Error al obtenir les imatges de la base de dades");

    } else {

      mostrarFotos();
      document.getElementById("loadingMessage").style.display = "none";

    }
    message.textContent = ("");
    document.getElementById("loadingMessage").style.display = "none";

  } catch (error) {

    console.error(error);

  }
}

//Funcio per a poder mappejar les fotos que ens torna la consulta POST;
function mostrarFotos() {

  console.log("Funció Mapejar Imatges");

  if (globalArrayFotos.photos.length > 0) {

    //Recorrem tot l'array.

    for (let i = 0; i < globalArrayFotos.photos.length; i++) {
      const base64 = globalArrayFotos.photos[i].base64;
      const name = globalArrayFotos.photos[i].name;

      //Generem el html i li donem style.

      const nameElement = document.createElement("p");
      nameElement.textContent = "Nombre: " + name;
      nameElement.style.textAlign = "center";
      nameElement.style.fontWeight = "bold";
      nameElement.style.marginBottom = "10px";

      const img = document.createElement("img");
      img.src = "data:image/png;base64," + base64;
      img.style.display = "block";
      img.style.maxWidth = "600px";
      img.style.margin = "0 auto";
      img.style.marginBottom = "10px";
      img.style.marginLeft = "20px";
      img.style.marginRight = "20px";

      //Ho mostrem dintre del div.

      const container = document.createElement("div");
      container.appendChild(nameElement);
      container.appendChild(img);
      document.body.appendChild(container);

      //Activem el boto per a poder descarregar les imatges.
      document.getElementById("download_pics").style.display = "block";
    }
  } else {
    console.log("La array fotos està buida");
  }
}


//Boto de descarregar les fotografies.
botonDWL.addEventListener('click', function (event) {

  console.log("Funció descarregar fotografies");

  //Recorrem tot l'array
  if (globalArrayFotos.photos.length > 0) {
    for (let i = 0; i < globalArrayFotos.photos.length; i++) {
      const base64 = globalArrayFotos.photos[i].base64;
      const name = globalArrayFotos.photos[i].name;

      //Creem un link de descarrega i al mateix temps simulem un click al link per aixi poder executar la descarrega de manera automatica.
      const link = document.createElement('a');
      link.href = 'data:image/png;base64,' + base64;
      link.download = name;
      link.click();
      link.remove();
    }
  } else {
    console.log("La array fotos està buida");
  }
}
);