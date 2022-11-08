//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ***********  JUEGO  *********** //////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Juego() {
    this.partidas = {};
    this.usuarios = {};  //array asociativo [clave][objeto]

    this.agregarUsuario = function (nick) {
        let res = { "nick": -1 };
        if (!this.usuarios[nick]) {
            this.usuarios[nick] = new Usuario(nick, this);
            res = { "nick": nick };
            console.log("Nuevo usuario: " + nick);
        }
        return res;
    }
    this.eliminarUsuario = function (nick) {
        delete this.usuarios[nick];
        console.log("El usuario " + nick + " ha salido del juego.")
    }

    this.usuarioSale = function (nick) {
        if (this.usuarios[nick]) {
            this.finalizarPartida(nick);
            this.eliminarUsuario(nick);
        }
    }


    this.eliminarPartida = function (index) {
        console.log("Partida " + this.partidas[index].codigo + " eliminada.");
        delete this.partidas[index];
    }

    this.obtenerPartida = function (codigo) {
        for (let key in this.partidas) {
            if (this.partidas[key].codigo == codigo) {
                return this.partidas[key];
            }
        }

    }

    this.jugadorCreaPartida = function (nick) {
        let usr = this.usuarios[nick];  //juego.obtenerUsuario(nick)
        let res = { codigo: -1 };
        if (usr) {
            let codigo = usr.crearPartida();
            //let codigo=this.crearPartida(usr);
            res = { codigo: codigo };
        }
        return res;
    }

    this.crearPartida = function (usr) {
        //obtener código único
        //crear partida con propietario nick
        //devolver el código
        let codigo = Date.now();
        console.log("Usuario " + usr.nick + " crea partida " + codigo);
        this.partidas[codigo] = new Partida(codigo, usr);
        return codigo;
    }

    this.unirseAPartida = function (codigo, usr) {
        let res = -1;
        if (this.partidas[codigo]) {
            res = this.partidas[codigo].agregarJugador(usr);
        } else {
            console.log("La partida no existe");
        }
        return res;
    }


    this.jugadorSeUneAPartida = function (nick, codigo) {
        let usr = this.usuarios[nick];
        let res = { "codigo": -1 };
        if (usr) {
            let valor = usr.unirseAPartida(codigo);
            //let valor=this.unirseAPartida(codigo,usr)
            res = { "codigo": valor };
        }
        return res;
    }

    this.obtenerUsuario = function (nick) {
        if (this.usuarios[nick]) {
            return this.usuarios[nick];
        }
    }

    this.salir = function (nick) {
        let res = { "codigo": -1 };
        this.eliminarUsuario(nick);
        for (let key in this.partidas) {
            if (this.partidas[key].owner.nick == nick) {
                res = { "codigo": this.partidas[key].codigo };
                this.eliminarPartida(key);
            }
        }
        return res;
    }

    this.obtenerPartida = function (codigo) {
        return this.partidas[codigo];
    }

    this.obtenerPartidas = function () {
        //return this.partidas;
        let lista = [];
        for (let key in this.partidas) {
            lista.push({ "codigo": key, "owner": this.partidas[key].owner.nick });
        }
        return lista;
    }

    this.obtenerPartidasDisponibles = function () {
        //devolver solo las partidas sin completar
        let lista = [];
        for (let key in this.partidas) {
            if (this.partidas[key].fase == "inicial") {
                lista.push({ "codigo": key, "owner": this.partidas[key].owner.nick });
            }
        }
        return lista;
    }


    this.finalizarPartida = function (nick) {
        for (let key in this.partidas) {
            if (this.partidas[key].fase == "inicial" && this.partidas[key].estoy(nick)) {
                this.partidas[key].fase = "final";
            }
        }
    }


}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// ***********  USUARIO  *********** /////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function Usuario(nick, juego) {
    this.nick = nick;
    this.juego = juego;
    this.tableroPropio;
    this.tableroRival;
    this.partida;
    this.flota = {}; //podría ser array []
    this.crearPartida = function () {
        return this.juego.crearPartida(this);
    }
    this.unirseAPartida = function (codigo) {
        return this.juego.unirseAPartida(codigo, this);
    }

    this.inicializarTableros = function (dim) {
        this.tableroPropio = new Tablero(dim);
        this.tableroRival = new Tablero(dim); //el tablero propio y el del rival tienen que ser iguales
    }

    this.inicializarFlota = function () {
        //ARRAY NORMAL:
        //this.flota.push(new Barco("b2",2)); //agrego dos barcos - como es una coleccion hago push => aqui lo hacemos como un array normal
        //this.flota.push(new Barco("b4",4));   

        //ARRAY ASOCIATIVO: -- tengo que iterar con las claves (ej: for-each)
        this.flota["b2"] = new Barco("b2", 2);
        this.flota["b4"] = new Barco("b4", 4); //va con clave-valor

        //otros barcos: 1, 3, 5, ...
    }

    this.colocarBarco = function (nombre, x, y) { //hecho para que lo diga el usuario
        //comprobar fase
        if (partida.fase == "desplegando") {  //en la fase en la que puedo colocar barcos es DESPLEGANDO --> es para evitar que el jugador coloque barcos en otra fase (como jugando)
            let barco = this.flota[nombre];
            this.tableroPropio.colocarBarco(barco, x, y); //delego en tablero...
        }
        //coloca el barco de nombre en la casilla x, y del tamaño propio

    }


    this.todosDesplegados = function () { //¿Están todos los barcos desplegados?
        for (var key in this.flota) {
            if (!this.flota[key].desplegado) { //no está desplegado
                return false;
            }
        }
        return true; //si acabo el bucle es que están todos desplegados
    }

    this.barcosDesplegados = function () {
        this.partida.barcosDesplegados();
    }


    //...despues tenemos que hacer al que le toque disparar
    this.disparar = function (x, y) { //dispara a una coordenada
        this.partida.disparar(this.nick, x, y); //le dices quien eres y a donde quieres disparar
    }

    this.meDisparan = function (x, y) {
        //hay que delegar en tablero --> delega en casilla --> delega en contiene
        this.tableroPropio.meDisparan(x, y);

    }

    this.obtenerEstado = function (x, y) {
        return this.tableroPropio.obtenerEstado(x, y); //devuelve un entero --> por eso es impt el return
    }

    this.marcarEstado = function (estado, x, y) {
        this.tableroRival.marcarEstado(estado, x, y);
        if (estado == "agua") {
            this.partida.cambiarTurno(this.nick);
        }
    }

    this.flotaHundida = function () { //¿Están todos los barcos hundido?
        for (var key in this.flota) {
            if (!this.flota[key].estado == "intacto") {
                return false;
            }
        }
        return true;
    }

}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////***********  PARTIDA  *********** /////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Partida(codigo, usr) {
    this.codigo = codigo;
    this.owner = usr;
    this.jugadores = [];
    this.fase = 'inicial'; 	//las voy a manejar como objeto	//new Inicial()
    this.maxJugadores = 2;

    this.agregarJugador = function (usr) {
        let res = this.codigo;
        if (this.hayHueco()) {
            this.jugadores.push(usr);
            console.log("El usuario " + usr.nick + " se une a la partida " + this.codigo);
            usr.partida = this;
            usr.inicializarTableros(5);
            usr.inicializarFlota();
            this.comprobarFase();
        }
        else {
            res = -1;
            console.log("La partida está completa")
        }
        return res;
    }

    this.esJugando = function () {
        return this.fase == "jugando";
    }


    this.esDesplegando = function () {
        return this.desplegado
    }

    this.comprobarFase = function () {
        if (!this.hayHueco()) {
            this.fase = "desplegando";   //de inicial -> desplegando paso cuando NO HAY HUECOS
        }
    }

    this.estoy = function (nick) {
        for (i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nick == nick) {
                return true;
            }
        } return false;
    }

    this.hayHueco = function () {
        return (this.jugadores.length < this.maxJugadores);
    }


    this.flotasDesplegadas = function () {
        for (i = 0; i < this.jugadores.length; i++) {
            if (!this.jugadores[i].todosDesplegados) {
                return false;
            }
        }
        return true;
    }

    this.barcosDesplegados = function () {
        if (this.flotasDesplegadas()) {
            this.fase = "jugando";
            this.asignarTurnoInicial();
        }
    }

    this.asignarTurnoInicial = function () {
        this.turno = this.jugadores[0]; //el turno lo tiene el jugador 0

    }

    this.cambiarTurno = function (nick) {
        this.turno = this.obtenerRival(nick);
    }

    this.obtenerRival = function (nick) {
        let rival;
        for (i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nick != nick) {
                rival = this.jugadores[i];
            }
        }
        return rival;
    }

    this.obtenerJugador = function (nick) {
        let jugador;
        for (i = 0; i < this.jugadores.length; i++) {
            if (this.jugadores[i].nick == nick) {
                jugador = this.jugadores[i];
            }
        }
        return jugador;
    }

    this.disparar = function (nick, x, y) {
        let atacante = this.obtenerJugador();

        if (this.turno.nick == atacante.nick) {
            let atacado = this.obtenerRival(nick);
            atacado.meDisparan(x, y);

            let estado = atacado.obtenerEstado(x, y);//estado de la casilla que ha sido disparada
            atacante.marcarEstado(estado, x, y); //tablero rival del atacante

            this.comprobarFin(atacado);
        }
        else {
            console.log("No es tu turno")
        }

    }

    this.comprobarFin = function (jugador) {
        if (jugador.flotaHundida()) {
            this.fase = "final";
            console.log("fin de la partida");
            console.log("Ganador: " + this.turno.nick);
        }
    }

    this.agregarJugador(this.owner);

}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////***********  TABLERO  *********** /////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Tablero(size) {
    this.size = size; //filas=columnas=size
    this.casillas;
    this.crearTablero = function (tam) {
        this.casillas = new Array(tam);
        for (x = 0; x < tam; x++) {
            this.casillas[x] = new Array(tam);
            for (y = 0; y < tam; y++) {
                this.casillas[x][y] = new Casilla(x, y);
            }
        }
    }

    this.colocarBarco = function (barco, x, y) {
        if (this.casillasLibres(x, y, barco.tam)) {
            for (i = x; i < barco.tam; i++) {
                this.casillas[i][y].contiene = barco;
            }
            barco.desplegado = true;
        }
    }

    this.casillasLibres = function (x, y, tamaño) {
        for (i = x; i < tam; i++) {
            let contiene = this.casillas[i][y].contiene;
            if (!contiene.esAgua()) {
                return false;
            }
        }

    }

    this.meDisparan = function () {
        this.casillas[x][y].contiene.meDisparan();
    }

    this.obtenerEstado = function (x, y) {
        return this.casillas[x][y].contiene.obtenerEstado();
    }

    this.marcarEstado = function (estado, x, y) {
        this.casillas[x][y].contiene = estado;
    }

    this.crearTablero(size);
}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ***********  CASILLA  *********** ////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Casilla(x, y) { //columna, fila
    this.x = x;
    this.y = y;
    this.contiene = new Agua(); //al principio el contiene tiene agua

}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// ***********  BARCO *********** /////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Barco(nombre, tam) {  // "b2" => barco tamaño 2
    this.nombre = nombre;
    this.tam = tam;
    this.desplegado = false;
    this.estado = "intacto";
    this.disparos = 0;
    // Asumimos que son todos HORIZONTALES!!
    this.orientacion; //horizontal, vertical... => NO LO USAMOS -- solo para implementaciones nuestras

    this.colocarBarco = function (barco, casilla) {
        console.log("Casilla ocupada");
    }

    this.meDisparan = function () {
        this.disparos++;
        if (this.disparos < this.tam) {
            this.estado = "tocado";
            console.log("Tocado");
        } else {
            this.estado = "hundido";
            console.log("Hundido!!");
        }

    }

    this.obtenerEstado = function () {
        return this.estado;

    }

}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// ***********  AGUA  *********** /////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Agua() {
    this.nombre = "agua";
    this.esAgua = function () {
        return true;
    }
    this.meDisparan = function () {
        console.log("agua")
    }
    this.obtenerEstado = function () {
        return "agua";
    }


}

//module.exports.Juego = Juego;

