import {Player} from "./player/player.js";
import {Music_manager} from "./music_manager.js"
import {Sound_manager} from  "./sound_manager.js"

export class Game {
    /** --- **[ variable de jeu ]** --- **/
    #player; #last_mouv;
    #colision; #matrice;
    #intervalId;
    #position_cerveau;

    /** --- **[ variable menu ]** --- **/
    #en_pause; #game_over;

    /** --- **[ variable audio ]** --- **/
    #is_music;
    static #music_manager = new Music_manager();
    static #sound_manager = new Sound_manager();

    static #vitesse = 170; //170
    static nb_case;

    /** --- **[ variable gestion bonus ]** --- **/
    #bonus_actif; #bonus_position;
    #bonus_name; #bonus_id;
    #bonus_vitesse; #id_reset_bonus;
    static #temps_avant_nouveau_bonus            = 10 * 1000;

    /** --- **[ variable bonus ]** --- **/

    // bombe
    static #temps_avant_disparition_bombe        = 10 * 1000;
    static #temps_avant_apparition_bombe         = 10 * 1000;
    #id_apparition_bombe_timeout;
    #allow_bombe;
    // tnt
    static #temps_avant_disparition_tnt          = 10 * 1000;
    static #temps_avant_apparition_tnt           = 10 * 1000;
    #id_apparition_tnt_timeout;
    #allow_tnt;
    // cœur
    static #temps_avant_disparition_coeur        = 10 * 1000;
    static #temps_avant_apparition_coeur         = 10 * 1000;
    #id_apparition_coeur_timeout;
    #coeur_est_apparut;
    #allow_coeur;
    // étoile
    static #temps_avant_disparition_etoile       = 10 * 1000;
    static #temps_avant_apparition_etoile        = 10 * 1000;
    static #temps_effect_etoile                  = 10 * 1000;
    #id_apparition_etoile_timeout;
    #id_etoile_timeout;
    #allow_etoile;
    // retro
    static #temps_avant_disparition_retro        = 10 * 1000;
    static #temps_avant_apparition_retro         = 10 * 1000;
    #id_apparition_retro_timeout;
    #retro_est_apparut;
    #allow_retro;


    /** -- **[ variable groupe ]** -- **/
    #allow_groupe;
    #id_apparition_groupe_timeout;
    // mago
    static #temps_avant_disparition_mago         = 10 * 1000;
    static #temps_avant_apparition_mago          = 10 * 1000;
    #id_apparition_mago_timeout;
    #allow_mago;
    // vito
    static #temps_avant_disparition_vito         = 10 * 1000;
    static #temps_avant_apparition_vito          = 10 * 1000;
    static #temps_effect_vito                    = 10 * 1000;
    #id_apparition_vito_timeout;
    #allow_vito;
    // nobru
    static #temps_avant_disparition_nobru        = 10 * 1000;
    static #temps_avant_apparition_nobru         = 10 * 1000;
    static #temps_effect_nobru                   = 10 * 1000;
    #id_apparition_nobru_timeout;
    #allow_nobru;
    // jekyll
    static #temps_avant_disparition_jekyll       = 10 * 1000;
    static #temps_avant_apparition_jekyll        = 10 * 1000;
    static #temps_effect_jekyll                  = 10 * 1000;
    #id_apparition_jekyll_timeout
    #allow_jekyll;
    // aspic
    static #temps_avant_disparition_aspic        = 10 * 1000;
    static #temps_avant_apparition_aspic         = 10 * 1000;
    static #temps_effect_aspic                   = 60 * 1000;
    #id_apparition_aspic_timeout
    #allow_aspic;
    #id_pizza_timeout
    #est_pizza;


    constructor(){
        this.init();
        this.#is_music = true;
        this.reset_parameter();
        this.placement_cerveau();
    }

    reset_parameter(){
        this.#last_mouv  = null;
        this.#en_pause   = true;
        this.#intervalId = null;
        this.#colision   = true;
        this.#game_over  = false;

        this.theme_zam_ii();
        this.reset_bonus();
        this.clear_timeout()
    }

    reset_bonus(){
        this.clear_bonus()
        this.#bonus_vitesse = 1;
        this.#bonus_actif = false;

        this.#allow_bombe = true;
        this.#allow_tnt = true;
        this.#allow_etoile = true;
        this.#allow_coeur = true;
        this.#allow_retro = true;
        this.#coeur_est_apparut = false;
        this.#retro_est_apparut = false;

        this.#allow_groupe = true;
        this.#allow_mago = true;
        this.#allow_aspic = true;
        this.#allow_vito = true;
        this.#allow_nobru = true;
        this.#allow_jekyll = true;

        this.#est_pizza = false;
    }

    clear_timeout(){
        clearTimeout(this.#id_apparition_bombe_timeout)
        clearTimeout(this.#id_apparition_tnt_timeout)
        clearTimeout(this.#id_apparition_etoile_timeout)
        clearTimeout(this.#id_apparition_retro_timeout)
        clearTimeout(this.#id_apparition_coeur_timeout)
        clearTimeout(this.#id_apparition_mago_timeout)
        clearTimeout(this.#id_apparition_aspic_timeout)
        clearTimeout(this.#id_apparition_vito_timeout)
        clearTimeout(this.#id_apparition_nobru_timeout)
        clearTimeout(this.#id_apparition_jekyll_timeout)
        clearTimeout(this.#id_apparition_groupe_timeout)

        clearTimeout(this.#id_reset_bonus)
        clearTimeout(this.#id_pizza_timeout)
        clearTimeout(this.#id_etoile_timeout)
    }

    //                      [ INITIALISATION ]                      \\
    init() {
        this.#init_case_number()
        this.#init_board();
        this.#init_matrice();
        this.#init_zam();
        this.#init_key();
        this.#init_button();
    }
    #init_matrice() {
        let matrice = [];
        for (let i = 0; i < Game.nb_case; i++) {
            matrice.push(new Array(Game.nb_case).fill(0)); // Remplace 0 par la valeur souhaitée
        }
        this.#matrice = matrice;
    }
    #init_case_number(){
        let width = window.innerWidth;
        let height = window.innerHeight;

        if ( height < 800 && height >= 700) Game.nb_case  = 19;
        else if ( height < 700 && height >= 600) Game.nb_case  = 17;
        else if ( height < 600 && height >= 500) Game.nb_case  = 15;
        else if ( height < 500 && height >= 400) Game.nb_case  = 13;
        else if ( height < 400 && height >= 300) Game.nb_case  = 11;
        else if ( height < 300 && height >= 200) Game.nb_case  = 9;
        else if ( height < 200 && height >= 0) Game.nb_case  = 7;
        else Game.nb_case  = 21;

        document.getElementById("swiper").classList.add("swiper"+Game.nb_case);
     }
    /** nettoyage du plateau et initialisation d’un nouveau **/
    #init_board () {
        const board = document.getElementById("board");
        board.innerHTML = "";
        for (let i = 0; i < Game.nb_case; i++) {
            for (let j = 0; j < Game.nb_case; j++) {
                const div = document.createElement('div');
                div.id = `${i}-${j}`;
                div.className = 'case';
                div.setAttribute('data-dist', '401');
                board.appendChild(div);
            }
        }
    }
    #init_zam () {
        let pos = ((Game.nb_case-1)/2)
        this.#player = new Player(pos, pos, Game.nb_case);
        this.get_case(pos, pos).classList.add(this.#player.get_horde().get_tete())
        this.#matrice[pos][pos] = this.#player.get_horde().get_tete()
    }
    #init_key () {
        document.addEventListener('keydown', (e) => {
            if      (e.key === 'z' || e.key === 'ArrowUp'   ) this.key_press_up();
            else if (e.key === 'q' || e.key === 'ArrowLeft' ) this.key_press_left();
            else if (e.key === 's' || e.key === 'ArrowDown' ) this.key_press_down();
            else if (e.key === 'd' || e.key === 'ArrowRight') this.key_press_right();
            if      (e.key === ' ')      this.key_press_space();
            if      (e.key === 'Escape') this.key_press_esc();
        });
    }
    #init_button() {
        document.getElementById("replay").addEventListener("click", () => this.reset());
        document.getElementById("music-player").addEventListener("click", () => this.switch_etat_musique());
    }


    //                    [ GESTION DES INPUTS ]                    \\
    key_press_up() {
        if (!this.#game_over) {Game.#sound_manager.play('mouvement');}
        if ((this.#player.get_horde().get_mouv() !== 's' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'z') {
            this.#last_mouv = 'z';
            if (this.#en_pause) { this.start() }
        }
    }
    #up(){
        this.#player.get_horde().set_mouv('z');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let nx =  x - 1
        if (x - 1 < 0) {
            if (this.#colision === true) {
                this.#player.perdre_vie()
                if (this.#player.est_mort()) {
                    this.game_over();
                    return;
                }
            } nx = Game.nb_case - 1;
        }
        this.#player.deplacer_horde();
        this.update_x(x, y, nx)
    }
    key_press_left(){
        if (!this.#game_over) {Game.#sound_manager.play('mouvement');}
        if ((this.#player.get_horde().get_mouv() !== 'd' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'q') {
            this.#last_mouv = 'q';
            if (this.#en_pause) { this.start(); }
        }

    }
    #left(){
        this.#player.get_horde().set_mouv('q');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let ny =  y - 1
        if (y - 1 < 0) {
            if (this.#colision === true) {
                this.#player.perdre_vie()
                if (this.#player.est_mort()) {
                    this.game_over();
                    return;
                }
            } ny = Game.nb_case - 1;
        }
        this.#player.deplacer_horde();
        this.update_y(x, y, ny)
    }
    key_press_down(){
        if (!this.#game_over) {Game.#sound_manager.play('mouvement');}
        if ((this.#player.get_horde().get_mouv() !== 'z' || this.#player.get_nb_zombies() < 1 )  && this.#last_mouv !== 's') {
            this.#last_mouv = 's';
            if (this.#en_pause) { this.start(); }
        }
    }
    #down(){
        this.#player.get_horde().set_mouv('s');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let nx =  x + 1
        if ( x + 1 >= Game.nb_case ) {
            if (this.#colision === true) {
                this.#player.perdre_vie()
                if (this.#player.est_mort()) {
                    this.game_over();
                    return;
                }
            } nx = 0;
        }
        this.#player.deplacer_horde();
        this.update_x(x, y, nx)
    }
    key_press_right(){
        if (!this.#game_over) {Game.#sound_manager.play('mouvement');}
        if ((this.#player.get_horde().get_mouv() !== 'q' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'd' ) {
            this.#last_mouv = 'd';
            if (this.#en_pause) { this.start(); }
        }
    }
    #right(){
        this.#player.get_horde().set_mouv('d');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let ny =  y + 1
        if ( y + 1 >= Game.nb_case ) {
            if (this.#colision === true) {
                this.#player.perdre_vie()
                if (this.#player.est_mort()) {
                    this.game_over();
                    return;
                }
            } ny = 0;

        }
        this.#player.deplacer_horde();
        this.update_y(x, y, ny)
    }

    update_x(x, y, nx){
        if(this.#colision === true && this.#matrice[nx][y] !== 0 && this.#matrice[nx][y].substring(0,4) === "zomb" ) {
            this.#player.perdre_vie();
            if (this.#player.est_mort()) {
                this.game_over();
                return;
            }
        }
        this.#matrice[x][y] = 0;
        this.#matrice[nx][y] = 'zam';
        this.#player.get_horde().set_position(nx, y);
        if (nx === this.#position_cerveau[0] && y === this.#position_cerveau[1]) this.manger_cerveau();
        else if (this.#bonus_actif && this.#bonus_position != null && nx === this.#bonus_position[0] && y === this.#bonus_position[1]) this.prendre_bonus();
    }
    update_y(x, y, ny) {
        if(this.#colision === true && this.#matrice[x][ny] !== 0 && this.#matrice[x][ny].substring(0,4) === "zomb" ) {
            this.#player.perdre_vie();
            if (this.#player.est_mort()) {
                this.game_over();
                return;
            }
        }
        this.#matrice[x][y] = 0;
        this.#matrice[x][ny] = 'zam';
        this.#player.get_horde().set_position(x, ny);
        if (x === this.#position_cerveau[0] && ny === this.#position_cerveau[1]) this.manger_cerveau();
        else if (this.#bonus_actif && this.#bonus_position != null && x === this.#bonus_position[0] && ny === this.#bonus_position[1]) this.prendre_bonus();
    }

    key_press_space() { this.switch_etat_musique(); }
    key_press_esc() { if (!this.#en_pause) this.pause();}


    //                    [ FONCTION UTILITAIRE ]                    \\
    get_case(x, y){ return document.getElementById(x+'-'+y); }
    afficher_matrice_console() { for (let ligne of this.#matrice) { console.log(ligne.join("\t")); } }


    //                [ GESTION DE LA BOUCLE DE JEU ]                \\
    run() {
        switch (this.#last_mouv){
            case 'z' : this.#up(); break;
            case 'q' : this.#left(); break;
            case 's' : this.#down(); break;
            case 'd' : this.#right(); break;
            default : pause;
        }
        this.update_screen();
    }
    zombies_dans_matrice(){
        let z = this.#player.get_horde();
        let nbz = 0;
        const x_i = this.#player.get_horde().get_position()[0]
        const y_i = this.#player.get_horde().get_position()[1]
        while (z.get_suiv() != null){
            nbz += 1;
            z = z.get_suiv();
            let x = z.get_position()[0]; let y = z.get_position()[1];
            if (!(x === x_i && y === y_i))this.#matrice[x][y] = z.get_tete()
        }
    }
    clear_z() {
        for (let x = 0; x < Game.nb_case; x++) {
            for (let y = 0; y < Game.nb_case; y++) {
                if (this.#matrice[x][y] !== 0 && this.#matrice[x][y].substring(0,4) === "zomb") {
                    this.#matrice[x][y] = 0;
                }
            }
        }
    }

    update_screen() {
        this.clear_z()
        this.zombies_dans_matrice();
        if (!this.#bonus_actif ) this.placement_bonus();
        if (this.#position_cerveau === null){
            this.placement_cerveau();
        }
        for (let x = 0; x < Game.nb_case; x++) {
            for (let y = 0; y < Game.nb_case; y++) {
                this.get_case(x, y).className = "case";
                if (this.#matrice[x][y] !== 0 || (this.#matrice[x][y] === String && this.#matrice[x][y].substring(0,4) === "zomb")) {
                    this.get_case(x, y).classList.add(this.#matrice[x][y]);
                }
            }
        }
        document.getElementById("score").getElementsByClassName("score")[0].innerHTML = this.#player.get_score();
        document.getElementsByClassName("nbhorde")[0].innerHTML = this.#player.get_horde().get_size()-1;
        document.getElementsByClassName("nbvie")[0].innerHTML = this.#player.get_vie();
    }


    //                    [ GESTION DE LA PARTIE ]                    \\
    start() {
        if (!this.#game_over){
            this.#en_pause = false;
            this.#intervalId  = setInterval(() => this.run(), Game.#vitesse * this.#bonus_vitesse );
            this.cacher_notice();
            if (this.#is_music) {
                Game.#music_manager.play()
            }
        }
    }
    pause() {
        this.#en_pause = true
        clearInterval(this.#intervalId)
        this.#intervalId = null
        this.#last_mouv = null;
        if (this.#is_music) { Game.#music_manager.pause() }
    }
    reset() {
        this.reset_parameter();
        this.cacher_game_over();
        this.#init_matrice();
        this.#init_zam();
        this.placement_cerveau();
        this.update_screen();
        this.afficher_notice();
        if (this.#is_music) {
            Game.#music_manager.next()
        }
    }


    //                    [ GESTION DE LA MUSIQUE ]                    \\
    switch_etat_musique() { if (this.#is_music) this.desactiver_musique(); else this.activer_musique()}
    activer_musique() {
        this.#is_music = true;
        if (!this.#en_pause) (Game.#music_manager.play());
        let m = document.getElementById("music-player")
        m.classList.remove("music-off");
        m.classList.add("music-on")
    }
    desactiver_musique() {
        this.#is_music = false;
        Game.#music_manager.pause()
        let m = document.getElementById("music-player")
        m.classList.add("music-off");
        m.classList.remove("music-on")
    }


    //                     [ GESTION DU GAME OVER ]                     \\
    game_over(){
        Game.#sound_manager.play('game_over');
        this.pause()
        this.#game_over = true;
        document.getElementById("player_score").innerHTML = this.#player.get_score();
        this.afficher_game_over();
    }
    afficher_game_over(){
        if( document.getElementById( "game_over" ).classList.contains( "hide_go_popin" ) )
            document.getElementById( "game_over" ).classList.remove( "hide_go_popin" );
    }
    cacher_game_over() { if(!document.getElementById( "game_over" ).classList.contains("hide_go_popin"))
        document.getElementById( "game_over" ).classList.add( "hide_go_popin" );
    }


    //                      [ GESTION DES BONUS ]                      \\
    update_score(points){ this.#player.add_score(points); }
    #placement_item() {
        let x = Math.floor(Math.random() * Game.nb_case);
        let y = Math.floor(Math.random() * Game.nb_case);
        if (this.#matrice[x][y] === 0) {
            return [x, y];
        } else {
            return this.#placement_item();
        }
    }
    clear_bonus() {
        clearTimeout(this.#bonus_id);
        clearTimeout(this.#id_reset_bonus);
        if (this.#bonus_position != null) this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = 0;
        this.#bonus_position = null;
        this.#bonus_name = "";
        this.#bonus_id = null;
        this.#bonus_actif = true;
        this.#id_reset_bonus = setTimeout(() => {this.#bonus_actif = false}, Game.#temps_avant_nouveau_bonus)
    }
    prendre_bonus() {
        switch (this.#bonus_name) {
            case 'bombe'  : this.prendre_bombe();  break;
            case 'tnt'    : this.prendre_tnt();    break;
            case 'etoile' : this.prendre_etoile(); break;
            case 'vie'  : this.prendre_coeur();  break;
            case 'retro'  : this.prendre_retro();  break;

            //case 'mago'   : this.prendre_mago();   break;
            //case 'aspic'  : this.prendre_aspic();  break;
            //case 'vito'   : this.prendre_vito();   break;
            //case 'nobru'  : this.prendre_nobru();  break;
            //case 'jekyll' : this.prendre_jekyll(); break;
        }
    }
    placement_bonus() {
        let bonus_val = Math.floor(Math.random() * 100);
        if (bonus_val >= 50 && bonus_val < 65 && this.#player.get_horde().get_size() > 10 && this.#allow_bombe) { // 15%
            this.placement_bombe()
        }
        else if (bonus_val >= 65 && bonus_val < 75 && this.#player.get_horde().get_size() > 10 && this.#allow_etoile) { // 10 %
            this.placement_etoile(); console.log("etoile")
        }
        else if (bonus_val >= 75 && bonus_val < 80 && this.#player.get_horde().get_size() > 15 && this.#allow_coeur) { // 5%
            this.placement_coeur()
        }
        else if (bonus_val >= 80 && bonus_val < 85 && this.#player.get_horde().get_size() > 15 && this.#allow_retro) { // 5%
            this.placement_retro()
        }
        else if (bonus_val >= 85 && bonus_val < 90 && this.#player.get_horde().get_size() > 20 && this.#allow_tnt) { // 5%
            this.placement_tnt()
        }
        else if (bonus_val >= 90 && this.#player.get_score() > 149 && this.#allow_groupe) { // 10% / 2 : 5%
            console.log("Spawn groupe");
            let groupe = Math.floor(Math.random() * 26);
            if (groupe === 13) {
            } else if (groupe >= 14 && groupe < 17) {
            } else if (groupe >= 17 && groupe < 20) {
            } else if (groupe >= 20 && groupe < 23) {
            } else if (groupe >= 23 && groupe < 26) {
            }

        }
    }

    // gestion bombe
    prendre_bombe(){
        Game.#sound_manager.play("bombe");
        let liste = this.#player.retirer_trois_zombie();
        this.membre_timeout(liste)
        this.#player.add_score(5)
        this.bombe_remove();
    }
    placement_bombe() {
        if (!this.#bonus_actif) {
            let id = setTimeout(()=>
                { this.bombe_remove() },
                Game.#temps_avant_disparition_bombe
            );
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "bombe"
            this.#bonus_id = id;
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "bombe";
        }
    }
    bombe_remove() {
        this.#id_apparition_bombe_timeout = setTimeout(() => {this.#allow_bombe = true}, Game.#temps_avant_apparition_bombe);
        this.#allow_bombe = false;
        this.clear_bonus();
    }
    // gestion tnt
    prendre_tnt(){
        Game.#sound_manager.play("tnt");
        this.#player.clear_horde();
        this.membre_timeout(["mago", "aspic", "nobru", "vito", "jekyll"])
        this.#player.add_score(50)
        this.tnt_remove();
    }
    placement_tnt(){
        if (!this.#bonus_actif) {
            let id = setTimeout(()=>
                { this.tnt_remove() },
                Game.#temps_avant_disparition_tnt
            );
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "tnt"
            this.#bonus_id = id;
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "tnt";
        }
    }
    tnt_remove(){
        this.#id_apparition_tnt_timeout = setTimeout(() => {this.#allow_tnt = true}, Game.#temps_avant_apparition_tnt);
        this.#allow_tnt = false;
        this.clear_bonus();
    }
    // gestion cœur
    prendre_coeur(){
        Game.#sound_manager.play("vie");
        this.#player.gagner_vie();
        this.#coeur_est_apparut = true;
        this.#player.add_score(20);
        this.coeur_remove();
    }
    placement_coeur(){
        if (!this.#bonus_actif) {
            let id = setTimeout(()=>
                { this.coeur_remove() },
                Game.#temps_avant_disparition_coeur
            );
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "vie"
            this.#bonus_id = id;
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "vie";
        }
    }
    coeur_remove(){
        if (this.#coeur_est_apparut === false){
            this.#id_apparition_coeur_timeout = setTimeout(() => {this.#allow_coeur = true}, Game.#temps_avant_apparition_coeur);
        }
        this.#allow_coeur = false;
        this.clear_bonus();
    }
    // gestion étoile
    prendre_etoile(){
        Game.#sound_manager.play("etoile")
        clearTimeout(this.#bonus_id); // annule le timeout de disparition
        this.#bonus_actif = true;
        this.#bonus_position = null;
        this.#bonus_name = "";
        this.#bonus_id = null;
        // Ne pas appeler clear_bonus() ici pour ne pas déclencher le reset_bonus timeout
        this.#colision = false;
        let board = document.getElementsByClassName('board')[0];
        if (!board.classList.contains('invincible')) board.classList.add('invincible');
        this.#id_etoile_timeout = setTimeout(() => {
            this.#colision = true;
            this.etoile_remove();
        }, Game.#temps_effect_etoile)
    }
    placement_etoile(){
        if (!this.#bonus_actif) {
            let id = setTimeout(()=>
                { this.etoile_remove() },
                Game.#temps_avant_disparition_etoile
            );
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "etoile"
            this.#bonus_id = id;
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "etoile";
        }
    }
    etoile_remove(){
        this.#id_apparition_etoile_timeout = setTimeout(() => {this.#allow_etoile = true}, Game.#temps_avant_apparition_etoile);
        this.#allow_etoile = false;
        let board = document.getElementsByClassName('board')[0];
        if (board.classList.contains('invincible')) board.classList.remove('invincible');
        this.clear_bonus();
    }
    // gestion retro
    prendre_retro(){
        // Game.#sound_manager.play("");
        this.theme_retro_zam();
        this.#retro_est_apparut = true;
        this.#player.add_score(50);
        this.retro_remove();
    }
    placement_retro(){
        if (!this.#bonus_actif) {
            let id = setTimeout(()=>
                { this.retro_remove() },
                Game.#temps_avant_disparition_retro
            );
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "retro"
            this.#bonus_id = id;
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "retro";
        }
    }
    retro_remove(){
        if (this.#retro_est_apparut === false) {
            this.#id_apparition_retro_timeout = setTimeout(() => {this.#allow_retro = true}, Game.#temps_avant_apparition_retro);
        }
        this.#allow_retro = false;
        this.clear_bonus();
    }

    /** --- [ gestion groupe ] --- **/
    membre_timeout(list){
        for (let x = 0; x < list.length; x++){
            switch (list[x]){
                case "mago"   : this.#allow_mago   = false; this.#id_apparition_mago_timeout   = setTimeout(() => {this.#allow_mago   = true}, Game.#temps_avant_apparition_mago);   break;
                case "vito"   : this.#allow_vito   = false; this.#id_apparition_vito_timeout   = setTimeout(() => {this.#allow_vito   = true}, Game.#temps_avant_apparition_vito);   break;
                case "nobru"  : this.#allow_nobru  = false; this.#id_apparition_nobru_timeout  = setTimeout(() => {this.#allow_nobru  = true}, Game.#temps_avant_apparition_nobru);  break;
                case "aspic"  : this.#allow_aspic  = false; this.#id_apparition_aspic_timeout  = setTimeout(() => {this.#allow_aspic  = true}, Game.#temps_avant_apparition_aspic);  break;
                case "jekyll" : this.#allow_jekyll = false; this.#id_apparition_jekyll_timeout = setTimeout(() => {this.#allow_jekyll = true}, Game.#temps_avant_apparition_jekyll); break;
            }
        }
    }

    /** --- [ gestion pizza & cerveau ] --- **/
    placement_cerveau() {
        this.#position_cerveau = this.#placement_item();
        if (this.#est_pizza === false) this.#matrice[this.#position_cerveau[0]][this.#position_cerveau[1]] = 'cerveau';
        else this.#matrice[this.#position_cerveau[0]][this.#position_cerveau[1]] = 'pizza';
    }
    manger_cerveau() {
        if (this.#est_pizza === false){
            this.update_score(10 + (5 * this.#player.get_nb_memebre()));
            Game.#sound_manager.play("cerveau")
            this.#player.ajouter_un_zombie();
        } else {
            this.update_score(15);
            Game.#sound_manager.play("pizza")
        }
        this.#position_cerveau = null;
    }


    //                     [ GESTION DES THEMES ]                     \\
    switch_theme(){
        if(document.documentElement.classList.contains("zam-ii")){
            this.theme_retro_zam();
        } else {
            this.theme_zam_ii();
        }
    }
    theme_zam_ii(){
        if (!document.documentElement.classList.contains("zam-ii")) {
            document.documentElement.classList.add("zam-ii");
            document.documentElement.classList.remove("retro-zam");
            document.getElementById('title').innerHTML = "ZNAKE";
        }
    }
    theme_retro_zam(){
        if (!document.documentElement.classList.contains("retro-zam")) {
            document.documentElement.classList.add("retro-zam");
            document.documentElement.classList.remove("zam-ii");
            document.getElementById('title').innerHTML = "ZNAKE";
        }
    }


    afficher_notice() {
        if (document.getElementById("manual").classList.contains("hide_manual")) document.getElementById("manual").classList.remove("hide_manual");
    }
    cacher_notice() {
        if (!document.getElementById("manual").classList.contains("hide_manual")) document.getElementById("manual").classList.add("hide_manual");
    }
}