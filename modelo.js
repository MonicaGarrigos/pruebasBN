//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ***********  JUEGO  *********** //////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//let cad = require('./cad.js');

function Juego(test) {
    this.partidas = {};
    this.usuarios = {};  //array asociativo [clave][objeto]
   // this.cad = new cad.Cad(); //capa acceso de datos --> cuando haga new de Juego haga tambien new de Objeto Cad (es el obj implementado con la implementación con Mongo)
    this.test = test; //aqui le voy a decir si estoy pasando test o no

    this.agregarUsuario = function (nick) {
        let res = { "nick": -1 };
        if (!this.usuarios[nick]) {
            this.usuarios[nick] = new Usuario(nick, this);
            this.insertarLog({ "operacion": "inicioSesion", "usuario": nick, "fecha": Date() }, function () {
                console.log("Registro de log - (iniciar sesion) - insertado");
            });
            res = { "nick": nick };
            console.log("Nuevo usuario: " + nick);
        }
        return res;
    }
    this.eliminarUsuario = function (nick) {
        delete this.usuarios[nick];
        console.log("El usuario " + nick + " ha salido del juego (ha sido eliminado).")
    }

    this.usuarioSale = function (nick) {
        if (this.usuarios[nick]) {
            this.finalizarPartida(nick);
            this.eliminarUsuario(nick);
            this.insertarLog({ "operacion": "finSesion", "usuario": nick, "fecha": Date() }, function () {
                console.log("Registro de log - (salir) - insertado");
            });
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
        console.log("El usuario " + usr.nick + " crea el log " + codigo);
        this.insertarLog({ "operacion": "crearPartida", "propietario": usr.nick, "fecha": Date() }, function () {
            console.log("Insertado crearPartida");
        }); //clave=operacion

        this.partidas[codigo] = new Partida(codigo, usr);


        return codigo;
    }

    this.unirseAPartida = function (codigo, usr) {
        let res = -1;
        if (this.partidas[codigo]) {
            res = this.partidas[codigo].agregarJugador(usr);

            this.insertarLog({ "operacion": "unirsePartida", "usuario": usr.nick, "codigoPartida": codigo, "fecha": Date() }, function () {
                console.log("Registro de log - (unirse a partida) - insertado");
            });

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

    this.obtenerUsuario = function (nick) {  //código
        //if (this.usuarios[nick]) {
        return this.usuarios[nick];
        //}
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

    this.obtenerLogs = function (callback) {
        this.cad.obtenerLogs(callback);
    }


    this.insertarLog = function (log, callback) {
        if (this.test == 'false') {
            console.log(log, callback)
        }
    }

    // if (!test) { //conectar lo voy a hacer en Jugador en vez de en cad
    //     this.cad.conectar(function (db) {
    //         console.log("conectado a Atlas");
    //     })
    // }


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
        this.flota["b1"] = new Barco("b1", 1);
        this.flota["b2"] = new Barco("b2", 2);
        //this.flota["b4"] = new Barco("b4", 4); //va con clave-valor

        //otros barcos: 1, 3, 5, ...
    }

    this.colocarBarco = function (nombre, x, y) { //hecho para que lo diga el usuario
        //comprobar fase
        if (this.partida.fase == "desplegando") {  //en la fase en la que puedo colocar barcos es DESPLEGANDO --> es para evitar que el jugador coloque barcos en otra fase (como jugando)
            let barco = this.flota[nombre];
            //console.log("Holaaa" + barco);
            this.tableroPropio.colocarBarco(barco, x, y); //delego en tablero...
            console.log("El usuario", this.nick, "coloca el barco", barco.nombre, "en la posicion", x, y)
            return barco;
        }
        //coloca el barco de nombre en la casilla x, y del tamaño propio

    }

    this.comprobarLimites = function (tam, x) {
        return this.tableroPropio.comprobarLimites(tam, x)
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
        //console.log(this.partida)
    }


    //...despues tenemos que hacer al que le toque disparar
    this.disparar = function (x, y) { //dispara a una coordenada
        this.partida.disparar(this.nick, x, y); //le dices quien eres y a donde quieres disparar
    }

    this.meDisparan = function (x, y) {
        //hay que delegar en tablero --> delega en casilla --> delega en contiene
        return this.tableroPropio.meDisparan(x, y);

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
            if (!this.flota[key].estado != "hundido") {
                return false;
            }
        }
        return true;
    }
    this.obtenerFlota = function () {
        return this.flota;
    }

    /*this.obtenerBarcoDesplegado = function (nombre, x) {
        for (let key in this.flota) {
            if (this.flota[key].nombre == nombre) {
                if (this.comprobarLimites(this.flota[key].tam, x)) {
                    return this.flota[key];
                } else {
                    return false
                }
            }
        }
        return undefined
    }*/

    this.logAbandonarPartida = function (jugador, codigo) {
        this.juego.insertarLog({ "operacion": "abandonarPartida", "usuario": jugador.nick, "codigo": codigo, "fecha": Date() }, function () {
            console.log("Registro de log - (abandonar) - insertado");
        });

    }
    this.logFinalizarPartida = function (perdedor, ganador, codigo) {
        this.juego.insertarLog({ "operacion": "finalizarPartida", "perdedor": perdedor, "ganador": ganador, "codigo": codigo, "fecha": Date() }, function () {
            console.log("Registro de log(finalizarPartida) insertado");
        });
    }


}



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ***********  PARTIDA  *********** /////////////////////////////////////////////////////////////////////
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
            console.log("Hay " + this.jugadores.length + " jugadores");

            usr.partida = this;
            usr.inicializarTableros(10);
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
        return this.fase == "desplegando";
    }

    this.esFinal = function () {
        return this.fase == "final";
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
            if (!this.jugadores[i].todosDesplegados()) {
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
        console.log("se pone elturno");
        this.turno = this.jugadores[0]; //el turno lo tiene el jugador 0

    }

    this.cambiarTurno = function (nick) {
        this.turno = this.obtenerRival(nick);
    }


    this.obtenerTurno = function () {
        return this.turno
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
        let atacante = this.obtenerJugador(nick);

        if (this.turno.nick == atacante.nick) { 

            let atacado = this.obtenerRival(nick);
            let estado = atacado.meDisparan(x, y);
            //let estado=atacado.obtenerEstado(x,y);
            console.log(estado);
            atacante.marcarEstado(estado, x, y);

            this.comprobarFin(atacado);
            console.log(atacante.nick + ' dispara a ' + atacado.nick + ' en casillas ' + x, y);
            return estado;
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

            jugador.logFinalizarPartida(jugador.nick, this.turno.nick, this.codigo);

        }
    }


    this.abandonarPartida = function (jugador) {
        if (jugador) {

            rival = this.obtenerRival(jugador.nick)
            this.fase = "final";
            console.log("Fin de la partida");
            console.log("Ha abandonado el jugador " + jugador.nick);

            if (rival) {
                console.log("Ganador: " + rival.nick);
            }

            jugador.logAbandonarPartida(jugador, this.codigo);

        }
    }

    this.agregarJugador(this.owner);

}




//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ***********  TABLERO  *********** /////////////////////////////////////////////////////////////////////
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
        //console.log(barco);
        if (this.casillasLibres(x, y, barco.tam)) {
            for (i = 0; i < barco.tam; i++) {
                this.casillas[i+x][y].contiene = barco;
            }
            barco.desplegado = true;
        }
    }

    this.comprobarLimites = function (tam, x) {
        if (x + tam > this.size) {
            console.log('excede los limites')
            return false
        } else {
            return true
        }
    }

    this.casillasLibres = function (x, y, tam) {
        if (this.comprobarLimites()){
            for (i = 0; i < tam; i++) {
                let contiene = this.casillas[i+x][y].contiene;
                if (!contiene.esAgua()) {
                    return false;
                }
            }
            return true;
        }
        else{
            return false;
        }

    }

    this.meDisparan = function (x, y) {
        return this.casillas[x][y].contiene.meDisparan(this, x, y);
    }

    this.obtenerEstado = function (x, y) {
        return this.casillas[x][y].contiene.obtenerEstado();
    }

    this.marcarEstado = function (estado, x, y) {
        this.casillas[x][y].contiene = estado;
    }

    this.ponerAgua = function (x, y) {
        return this.casillas[x][y].contiene = new Agua();
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

    this.esAgua = function () {
        return false;
    }

    this.colocarBarco = function (barco, casilla) {
        console.log("Casilla ocupada");
    }

    this.meDisparan = function (tablero,x,y) {
        this.disparos++;
        if (this.disparos < this.tam) {
            this.estado = "tocado";
            console.log("Tocado");
        } else {
            this.estado = "hundido";
            console.log("Hundido!!!");

        }
        tablero.ponerAgua(x, y);
        //console.log(this.estado);
        return this.estado;

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

    this.meDisparan = function (tablero, x, y) {
        console.log("agua");
        return this.obtenerEstado();
    }

    this.obtenerEstado = function () {
        return "agua";
    }

}

//Conveniente crear las clases de las fases y mover algunos metodos a ellas

function Inicial() {  //En esta por ejemplo el agregar jugador
    this.nombre = "inicial"
}
//y las demas


//module.exports.Juego = Juego;