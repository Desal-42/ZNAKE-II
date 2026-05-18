import {Player} from "./player/player.js";
import {Music_manager} from "./music_manager.js"
import {Sound_manager} from  "./sound_manager.js"
import {Cookies} from "../cookies/cookies.js";

export class Game {
    /** --- **[ variable de jeu ]** --- **/
    #player; #last_mouv;
    #colision; #matrice;
    #intervalId;
    #position_cerveau;
    static #vitesse = 170;
    static nb_case;
    #time_left_bar_raf = null;
    #time_left_actif_raf = null;
    #effect_timer = null;
    #effect_expires_at = null;
    #tl_expires_at = null;
    #tla_expires_at = null;
    #tl_total_ms = null;
    #tla_total_ms = null;
    #grace_timer = null;

    /** ------------------ **[ variable cookies ]** ------------------ **/
    static #cookie_manager = new Cookies();
    #is_cookies;

    /** ------------------ **[ variable menu ]** ------------------ **/
    #en_pause; #game_over; #menue_pause;
    #freeze;


    /** ----------------- **[ variable audio ]** ----------------- **/
    #is_music; #is_sound;
    static #music_manager = new Music_manager();
    static #sound_manager = new Sound_manager();
    static #sound_manager_deplacement = new Sound_manager();


    /** ------------- **[ variable gestion bonus ]** ------------- **/
    #bonus_actif; #bonus_position;
    #bonus_name; #bonus_id;
    #bonus_vitesse;
    static #temps_avant_nouveau_bonus            = 10 * 1000;

    /** ----------------- **[ variable bonus ]** ----------------- **/
    // bombe
    static #temps_avant_disparition_bombe        = 10  * 1000;
    static #temps_avant_apparition_bombe         = 20  * 1000;
    #allow_bombe;
    // tnt
    static #temps_avant_disparition_tnt          = 10  * 1000;
    static #temps_avant_apparition_tnt           = 20  * 1000;
    #allow_tnt;
    // cœur
    static #temps_avant_disparition_coeur        = 10  * 1000;
    static #temps_avant_apparition_coeur         = 180 * 1000;
    #coeur_est_apparut;
    #allow_coeur;
    // étoile
    static #temps_avant_disparition_etoile       = 10  * 1000;
    static #temps_avant_apparition_etoile        = 20  * 1000;
    static #temps_effect_etoile                  = 10  * 1000;
    #allow_etoile;
    // retro
    static #temps_avant_disparition_retro        = 10  * 1000;
    static #temps_avant_apparition_retro         = 120  * 1000;
    #retro_est_apparut;
    #allow_retro;

    /** ----------------- **[ variable groupe ]** ----------------- **/
    #allow_groupe;
    static #temps_avant_apparition_groupe        = 60 * 1000;
    // mago
    static #temps_avant_disparition_mago         = 40  * 1000;
    static #temps_avant_apparition_mago          = 180 * 1000;
    #allow_mago;
    #mago_a_bouger;
    // vito
    static #temps_avant_disparition_vito         = 10  * 1000;
    static #temps_avant_apparition_vito          = 180 * 1000;
    static #temps_effect_vito                    = 10  * 1000;
    #allow_vito;
    // nobru
    static #temps_avant_disparition_nobru        = 10  * 1000;
    static #temps_avant_apparition_nobru         = 180 * 1000;
    static #temps_effect_nobru                   = 10  * 1000;
    static #nb_click_kill                        = 3;
    #nobru_click;
    #allow_nobru;
    // jekyll
    static #temps_avant_disparition_jekyll       = 10  * 1000;
    static #temps_avant_apparition_jekyll        = 180 * 1000;
    static #temps_effect_jekyll                  = 10  * 1000;
    #allow_jekyll;
    // aspic
    static #temps_avant_disparition_aspic        = 10  * 1000;
    static #temps_avant_apparition_aspic         = 180 * 1000;
    static #temps_effect_aspic                   = 60  * 1000;
    #allow_aspic;
    #est_pizza;


    /** ------- **[ système de timers piloté par le tick ]** ------- **/
    // Chaque entrée : { callback: Function, expires_at: number }
    // expires_at est un timestamp absolu (Date.now() + délai).
    // À la pause, on mémorise l'instant de mise en pause ;
    // à la reprise on décale tous les expires_at du temps écoulé -> les timers se figent
    // pendant la pause sans aucun setTimeout/setInterval supplémentaire.
    #timers = [];
    #paused_at = null;
    #addTimer(callback, delay) {
        const entry = { callback, expires_at: Date.now() + delay };
        this.#timers.push(entry);
        return entry;
    }
    /** Annule un timer avant qu'il ne fire. */
    #clearTimer(entry) {
        if (entry == null) return;
        const i = this.#timers.indexOf(entry);
        if (i !== -1) this.#timers.splice(i, 1);
    }
    /**
     * Appelé à chaque tick de run() : déclenche les timers expirés.
     * Les callbacks sont appelés après avoir retiré l'entrée de la liste
     * pour éviter les doubles déclenchements.
     */
    #tick_timers() {
        const now = Date.now();
        // On copie le tableau car les callbacks peuvent eux-mêmes appeler
        // #addTimer / #clearTimer et modifier this.#timers.
        const expired = this.#timers.filter(t => now >= t.expires_at);
        this.#timers    = this.#timers.filter(t => now <  t.expires_at);
        for (const t of expired) t.callback();
    }
    /** Fige les timers : mémorise l'instant de pause. */
    #pause_timers() {this.#paused_at = Date.now();}
    /** Reprend les timers : décale tous les expires_at du temps passé en pause. */
    #resume_timers() {
        if (this.#paused_at !== null) {
            const elapsed = Date.now() - this.#paused_at;
            for (const t of this.#timers) t.expires_at += elapsed;
            if (this.#tl_expires_at  !== null) this.#tl_expires_at  += elapsed;
            if (this.#tla_expires_at !== null) this.#tla_expires_at += elapsed;
            this.#paused_at = null;
        }
    }
    /** Vide tous les timers (reset / game over). */
    #clear_all_timers() {
        this.#timers    = [];
        this.#paused_at = null;
    }


    constructor(){
        this.init();
        if (Game.#cookie_manager.get_cookie("is_cookies") === null) {
            document.getElementById("cookie").classList.remove("hide");
            this.#is_music = true;
            this.#is_sound = true;
        } else {
            if (Game.#cookie_manager.get_cookie("is_cookies") === "false"){
                this.setup_sans_cookie();
                console.log("pas cookie")
            } else {
                console.log("cookie")
                this.setup_cookie();
            }
        }
        this.reset_parameter();
        this.placement_cerveau();
    }

    //                     [ REINITIALISATION ]                     \\
    reset_parameter(){
        this.#last_mouv   = null;
        this.#en_pause    = true;
        this.#intervalId  = null;
        this.#colision    = true;
        this.#game_over   = false;
        this.#menue_pause = false;
        this.#freeze      = false;

        this.theme_zam_ii();
        this.reset_bonus();
        this.#clear_all_timers();
    }
    reset_bonus(){
        this.#stop_time_left_actif();
        this.clear_bonus()
        this.#tla_expires_at    = null;
        this.#tl_expires_at     = null;
        this.#tl_total_ms       = null;
        this.#tla_total_ms      = null;
        this.#bonus_vitesse     = 1;
        this.#bonus_actif       = false;

        this.#allow_bombe       = true;
        this.#allow_tnt         = true;
        this.#allow_etoile      = true;
        this.#allow_coeur       = true;
        this.#allow_retro       = true;
        this.#coeur_est_apparut = false;
        this.#retro_est_apparut = false;

        this.#allow_groupe      = true;
        this.#allow_mago        = true;
        this.#allow_aspic       = true;
        this.#allow_vito        = true;
        this.#allow_nobru       = true;
        this.#allow_jekyll      = true;

        this.#est_pizza         = false;
        this.#mago_a_bouger     = 0;
        this.#nobru_click       = 0;
    }

    //                      [ INITIALISATION ]                      \\
    init() {
        this.#init_case_number()
        this.#init_board();
        this.#init_touch();
        this.#init_matrice();
        this.#init_zam();
        this.#init_key();
        this.#init_button();
    }
    #init_matrice() {
        let matrice = [];
        for (let i = 0; i < Game.nb_case; i++) {
            matrice.push(new Array(Game.nb_case).fill(0));
        }
        this.#matrice = matrice;
    }
    #init_case_number(){
        let width = window.innerWidth;
        let height = window.innerHeight;

        if      ( height < 800 && height >= 700) Game.nb_case  = 19;
        else if ( height < 700 && height >= 600) Game.nb_case  = 17;
        else if ( height < 600 && height >= 500) Game.nb_case  = 15;
        else if ( height < 500 && height >= 400) Game.nb_case  = 13;
        else if ( height < 400 && height >= 300) Game.nb_case  = 11;
        else if ( height < 300 && height >= 200) Game.nb_case  = 9;
        else if ( height < 200 && height >= 0)   Game.nb_case  = 7;
        else Game.nb_case  = 21;

        document.getElementById("swiper").classList.add("swiper"+Game.nb_case);
    }
    /** nettoyage du plateau et initialisation d'un nouveau **/
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
            if      (e.key === ' ')       this.key_press_space();
            if      (e.key === 'Escape')  this.key_press_esc();
            if      (e.key === 'Enter')   this.key_press_enter();
            if      (e.key === 'Enter' && this.#freeze === true) this.kill_z();
        });
        document.addEventListener('click', () => {
            if (this.#freeze === true) this.kill_z();
        });
    }
    #init_touch() {
        let touch_start_x = null;
        let touch_start_y = null;
        let touch_start_time = null;
        const SEUIL = 20;       // px minimum pour valider un swipe
        const TAP_DUREE = 200;  // ms maximum pour un tap

        document.addEventListener('touchstart', (e) => {
            touch_start_x    = e.touches[0].clientX;
            touch_start_y    = e.touches[0].clientY;
            touch_start_time = Date.now();
        }, { passive: true });
        document.addEventListener('touchmove', (e) => {
            if (touch_start_x === null) return;
            const dy = e.touches[0].clientY - touch_start_y;
            const dx = e.touches[0].clientX - touch_start_x;
            // Bloque le pull-to-refresh ET le scroll horizontal natif
            if (Math.abs(dy) > 10 || Math.abs(dx) > 10) {
                e.preventDefault();
            }
        }, { passive: false }); // passive: false obligatoire pour preventDefault
        document.addEventListener('touchend', (e) => {
            if (touch_start_x === null) return;

            const dx       = e.changedTouches[0].clientX - touch_start_x;
            const dy       = e.changedTouches[0].clientY - touch_start_y;
            const abs_dx   = Math.abs(dx);
            const abs_dy   = Math.abs(dy);
            const duree    = Date.now() - touch_start_time;

            touch_start_x    = null;
            touch_start_y    = null;
            touch_start_time = null;

            // Tap court pour kill z
            if (abs_dx < SEUIL && abs_dy < SEUIL && duree < TAP_DUREE) {
                if (this.#freeze) this.kill_z(); return;
            }

            // Swipe : axe dominant
            if (abs_dx > abs_dy) {
                if (dx > 0) this.key_press_right();
                else        this.key_press_left();
            } else {
                if (dy > 0) this.key_press_down();
                else        this.key_press_up();
            }
        }, { passive: true });
    }
    #init_button() {
        document.getElementById("replay").addEventListener(      "click", () => this.reset());
        document.getElementById("music-player").addEventListener("click", () => this.switch_etat_musique());
        document.getElementById("menupause").addEventListener(   "click", () => { if (!this.#en_pause){ this.#menue_pause = true; this.pause();} });
        document.getElementById("cookie-ok").addEventListener(   "click", () => { this.accepter_cookies() });
        document.getElementById("cookie-non").addEventListener(  "click", () => { this.refuser_cookies() });
    }
    //                    [ GESTION DES COOKIES ]                    \\
    accepter_cookies(){
        document.getElementById("cookie").classList.add("hide");
        Game.#cookie_manager.set_cookie("is_cookies", 30, true);
        Game.#cookie_manager.set_cookie("is_sound", 30, true);
        Game.#cookie_manager.set_cookie("is_music", 30, true);
        this.setup_cookie()

    }
    refuser_cookies(){
        document.getElementById("cookie").classList.add("hide")
        Game.#cookie_manager.set_cookie("is_cookies", 365, false)
        this.setup_sans_cookie()
    }

    setup_cookie(){
        this.#is_cookies = true;
        console.log("sound = " + Game.#cookie_manager.get_cookie("is_sound"))
        if (Game.#cookie_manager.get_cookie("is_sound") === "true") this.#is_sound = true;
        else this.#is_sound = false;
        let m = document.getElementById("music-player")
        if (Game.#cookie_manager.get_cookie("is_music") === "true") {
            this.#is_music = true;
            m.classList.remove("music-off");
            m.classList.add("music-on")
        } else {
            this.#is_music = false;
            m.classList.add("music-off");
            m.classList.remove("music-on")
        }
    }

    setup_sans_cookie() {
        this.#is_cookies = false
        this.#is_music = true;
        this.#is_sound = true;
    }


    //                    [ GESTION DES INPUTS ]                    \\
    key_press_up() {
        if (this.#en_pause) {
            this.start();
            if (this.#last_mouv == null) {
                if (this.#player.get_horde().get_mouv() != null) this.#last_mouv = this.#player.get_horde().get_mouv()
                else this.#last_mouv = 'z';
            }
        }
        else {
            if (!this.#game_over) { if (this.#is_sound === true)  Game.#sound_manager_deplacement.play('mouvement');}
            if ((this.#player.get_horde().get_mouv() !== 's' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'z') {
                this.#last_mouv = 'z';
            }
        }
    }
    key_press_left(){
        if (this.#en_pause) {
            this.start();
            if (this.#last_mouv == null) {
                if (this.#player.get_horde().get_mouv() != null) this.#last_mouv = this.#player.get_horde().get_mouv()
                else this.#last_mouv = 'q';
            }
        }
        else {
            if (!this.#game_over) { if (this.#is_sound === true) Game.#sound_manager_deplacement.play('mouvement');}
            if ((this.#player.get_horde().get_mouv() !== 'd' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'q') {
                this.#last_mouv = 'q';
            }
        }
    }
    key_press_down(){
        if (this.#en_pause) {
            this.start();
            if (this.#last_mouv == null) {
                if (this.#player.get_horde().get_mouv() != null) this.#last_mouv = this.#player.get_horde().get_mouv()
                else this.#last_mouv = 's';
            }
        }
        else {
            if (!this.#game_over) { if (this.#is_sound === true) Game.#sound_manager_deplacement.play('mouvement');}
            if ((this.#player.get_horde().get_mouv() !== 'z' || this.#player.get_nb_zombies() < 1 )  && this.#last_mouv !== 's') {
                this.#last_mouv = 's';
            }
        }
    }
    key_press_right(){
        if (this.#en_pause) {
            this.start();
            if (this.#last_mouv == null) {
                if (this.#player.get_horde().get_mouv() != null) this.#last_mouv = this.#player.get_horde().get_mouv()
                else this.#last_mouv = 'd';
            }
        }
        else {
            if (!this.#game_over) { if (this.#is_sound === true) Game.#sound_manager_deplacement.play('mouvement');}
            if ((this.#player.get_horde().get_mouv() !== 'q' || this.#player.get_nb_zombies() < 1 ) && this.#last_mouv !== 'd' ) {
                this.#last_mouv = 'd';
            }
        }
    }
    key_press_space() { this.switch_etat_musique(); }
    key_press_esc() { if (!this.#en_pause) this.#menue_pause = true; this.pause();}
    key_press_enter() { if (!document.getElementById("game_over").classList.contains("hide_go_popin") && document.getElementById("save").classList.contains("hide")) {this.reset()}}


    //                    [ GESTION DES MOUVEMENTS ]                    \\
    #up(){
        this.#player.get_horde().set_mouv('z');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let nx =  x - 1
        if (x - 1 < 0) {
            if (this.#colision === true) {
                this.perdre_vie()
            } nx = Game.nb_case - 1;
        }
        this.#player.deplacer_horde();
        this.update_x(x, y, nx)
    }
    #left(){
        this.#player.get_horde().set_mouv('q');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let ny =  y - 1
        if (y - 1 < 0) {
            if (this.#colision === true) {
                this.perdre_vie()
            } ny = Game.nb_case - 1;
        }
        this.#player.deplacer_horde();
        this.update_y(x, y, ny)
    }
    #down(){
        this.#player.get_horde().set_mouv('s');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let nx =  x + 1
        if ( x + 1 >= Game.nb_case ) {
            if (this.#colision === true) {
                this.perdre_vie()
            } nx = 0;
        }
        this.#player.deplacer_horde();
        this.update_x(x, y, nx)
    }
    #right(){
        this.#player.get_horde().set_mouv('d');
        let x = this.#player.get_horde().get_position()[0]; let y = this.#player.get_horde().get_position()[1];
        let ny =  y + 1
        if ( y + 1 >= Game.nb_case ) {
            if (this.#colision === true) {
                this.perdre_vie()
            } ny = 0;
        }
        this.#player.deplacer_horde();
        this.update_y(x, y, ny)
    }

    update_x(x, y, nx){
        if(this.#colision === true && this.#matrice[nx][y] !== 0 && this.#matrice[nx][y].substring(0,4) === "zomb" ) {
            const queue = this.#player.get_horde().get_queue();
            const [qx, qy] = queue.get_position();
            if (!(nx === qx && y === qy)) {
                this.perdre_vie();
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
            const queue = this.#player.get_horde().get_queue();
            const [qx, qy] = queue.get_position();
            if (!(x === qx && ny === qy)) {
                this.perdre_vie();
            }
        }
        this.#matrice[x][y] = 0;
        this.#matrice[x][ny] = 'zam';
        this.#player.get_horde().set_position(x, ny);
        if (x === this.#position_cerveau[0] && ny === this.#position_cerveau[1]) this.manger_cerveau();
        else if (this.#bonus_actif && this.#bonus_position != null && x === this.#bonus_position[0] && ny === this.#bonus_position[1]) this.prendre_bonus();
    }


    //                    [ FONCTION UTILITAIRE ]                    \\
    get_case(x, y){ return document.getElementById(x+'-'+y); }
    afficher_matrice_console() { for (let ligne of this.#matrice) { console.log(ligne.join("\t")); } }
    // --- [ gestion barre de temps ] --- \\
    #start_time_left(duration_ms) {
        this.#stop_time_left(false);
        const bar = document.querySelector('.time_left');
        if (!bar) return;
        bar.style.display = 'block';
        this.#tl_expires_at = Date.now() + duration_ms;
        this.#tl_total_ms   = duration_ms;
        const end   = this.#tl_expires_at;
        const total = duration_ms;
        const tick = () => {
            const ratio = Math.max(0, (end - Date.now()) / total);
            bar.style.setProperty('--tl-width', ratio);
            if (ratio > 0) this.#time_left_bar_raf = requestAnimationFrame(tick);
            else this.#stop_time_left();
        };
        this.#time_left_bar_raf = requestAnimationFrame(tick);
    }
    #stop_time_left(reset_css = true) {
        if (this.#time_left_bar_raf) {
            cancelAnimationFrame(this.#time_left_bar_raf);
            this.#time_left_bar_raf = null;
        }
        if (reset_css) {
            const bar = document.querySelector('.time_left');
            if (bar) { bar.style.display = 'none'; bar.style.setProperty('--tl-width', 1); }
            this.#tl_expires_at = null;
            this.#tl_total_ms   = null;
        }
    }
    #start_time_left_actif(duration_ms) {
        this.#stop_time_left_actif(false);
        const bar = document.querySelector('.time_left_actif');
        if (!bar) return;
        bar.style.display = 'block';
        this.#tla_expires_at = Date.now() + duration_ms;
        this.#tla_total_ms   = duration_ms;
        const end   = this.#tla_expires_at;
        const total = duration_ms;
        const tick = () => {
            const ratio = Math.max(0, (end - Date.now()) / total);
            bar.style.setProperty('--tla-width', ratio);
            if (ratio > 0) this.#time_left_actif_raf = requestAnimationFrame(tick);
            else this.#stop_time_left_actif();
        };
        this.#time_left_actif_raf = requestAnimationFrame(tick);
    }
    #stop_time_left_actif(reset_css = true) {
        if (this.#time_left_actif_raf) {
            cancelAnimationFrame(this.#time_left_actif_raf);
            this.#time_left_actif_raf = null;
        }
        if (reset_css) {
            const bar = document.querySelector('.time_left_actif');
            if (bar) { bar.style.display = 'none'; bar.style.setProperty('--tla-width', 1); }
            this.#tla_expires_at = null;
            this.#tla_total_ms   = null;
        }
    }


    //                [ GESTION DE LA BOUCLE DE JEU ]                \\
    run() {
        // Tick des timers en premier : déclenche les callbacks expirés
        this.#tick_timers();
        switch (this.#last_mouv){
            case 'z' : if (this.#freeze === false) this.#up();    break;
            case 'q' : if (this.#freeze === false) this.#left();  break;
            case 's' : if (this.#freeze === false) this.#down();  break;
            case 'd' : if (this.#freeze === false) this.#right(); break;
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
                if (this.#matrice[x][y] !== 0 && (this.#matrice[x][y].substring(0,4) === "zomb" || (this.#matrice[x][y].substring(0,4) === "retr" && this.#retro_est_apparut === true) || this.#player.get_liste_membre().includes(this.#matrice[x][y]) || this.#matrice[x][y] === 'zam') ) {
                    this.#matrice[x][y] = 0;
                }
            }
        }
    }
    update_screen() {
        this.clear_z()
        this.zombies_dans_matrice();
        this.#matrice[this.#player.get_horde().get_position()[0]][this.#player.get_horde().get_position()[1]] = 'zam'
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
        if (this.#bonus_name === 'mago') { this.move_mago(); }
        document.getElementById("score").getElementsByClassName("score")[0].innerHTML = this.#player.get_score();
        document.getElementsByClassName("nbhorde")[0].innerHTML = this.#player.get_horde().get_size()-1;
        document.getElementsByClassName("nbvie")[0].innerHTML = this.#player.get_vie();
    }


    //                    [ GESTION DE LA PARTIE ]                    \\
    start() {
        if (!this.#game_over){
            this.#en_pause = false;
            this.#menue_pause = false;
            let menue_pause = document.getElementsByClassName("pause")[0];
            if (!menue_pause.classList.contains("hide_manual")) menue_pause.classList.add("hide_manual")
            this.#resume_timers();
            // Relancer les barres de progression si elles étaient actives avant la pause
            if (this.#tl_expires_at !== null && this.#tl_total_ms !== null) {
                const remaining = this.#tl_expires_at - Date.now();
                if (remaining > 0) {
                    // Relancer le RAF en réutilisant expires_at et total déjà en place
                    const bar = document.querySelector('.time_left');
                    if (bar) {
                        bar.style.display = 'block';
                        const end   = this.#tl_expires_at;
                        const total = this.#tl_total_ms;
                        const tick = () => {
                            const ratio = Math.max(0, (end - Date.now()) / total);
                            bar.style.setProperty('--tl-width', ratio);
                            if (ratio > 0) this.#time_left_bar_raf = requestAnimationFrame(tick);
                            else this.#stop_time_left();
                        };
                        this.#time_left_bar_raf = requestAnimationFrame(tick);
                    }
                } else {
                    this.#tl_expires_at = null;
                    this.#tl_total_ms   = null;
                    this.#stop_time_left();
                }
            }
            if (this.#tla_expires_at !== null && this.#tla_total_ms) {
                const remaining = this.#tla_expires_at - Date.now();
                if (remaining > 0) {
                    const bar = document.querySelector('.time_left_actif');
                    if (bar) {
                        bar.style.display = 'block';
                        const end   = this.#tla_expires_at;
                        const total = this.#tla_total_ms;
                        const tick = () => {
                            const ratio = Math.max(0, (end - Date.now()) / total);
                            bar.style.setProperty('--tla-width', ratio);
                            if (ratio > 0) this.#time_left_actif_raf = requestAnimationFrame(tick);
                            else this.#stop_time_left_actif();
                        };
                        this.#time_left_actif_raf = requestAnimationFrame(tick);
                    }
                } else {
                    this.#tla_expires_at = null;
                    this.#tla_total_ms   = null;
                    this.#stop_time_left_actif();
                }
            }
            if (this.#intervalId !== null) clearInterval(this.#intervalId);
            this.#intervalId = setInterval(() => this.run(), Game.#vitesse * this.#bonus_vitesse);
            this.cacher_notice();
            if (this.#is_music) { Game.#music_manager.play() }
        }
    }
    pause() {
        this.#en_pause = true
        if (this.#menue_pause) {
            let menue_pause = document.getElementsByClassName("pause")[0];
            if (menue_pause.classList.contains("hide_manual")) menue_pause.classList.remove("hide_manual")
        }
        this.#stop_time_left(false);
        this.#stop_time_left_actif(false);
        this.#pause_timers();
        clearInterval(this.#intervalId)
        this.#intervalId = null
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

    afficher_notice() {
        if (document.getElementById("manual").classList.contains("hide_manual")) document.getElementById("manual").classList.remove("hide_manual");
    }
    cacher_notice() {
        if (!document.getElementById("manual").classList.contains("hide_manual")) document.getElementById("manual").classList.add("hide_manual");
    }


    //                    [ GESTION DE LA MUSIQUE ]                    \\
    switch_etat_musique() { if (this.#is_music) this.desactiver_musique(); else this.activer_musique() }
    activer_musique() {
        this.#is_music = true;
        if (this.#is_cookies) Game.#cookie_manager.update_cookie("is_music", true)

        if (!this.#en_pause) (Game.#music_manager.play());
        let m = document.getElementById("music-player")
        m.classList.remove("music-off");
        m.classList.add("music-on")
    }
    desactiver_musique() {
        this.#is_music = false;
        if (this.#is_cookies) Game.#cookie_manager.update_cookie("is_music", false)
        Game.#music_manager.pause()
        let m = document.getElementById("music-player")
        m.classList.add("music-off");
        m.classList.remove("music-on")
    }


    //                     [ GESTION DU GAME OVER ]                     \\
    perdre_vie() {
        this.#player.perdre_vie();
        if (this.#player.est_mort()) {
            this.game_over();
            return;
        } else {
            if (this.#is_sound === true) Game.#sound_manager.play('vie_perdu')
            this.#colision = false;
            this.#clearTimer(this.#grace_timer);
            this.#grace_timer = this.#addTimer(() => {
                this.#grace_timer = null;
                this.#colision = true;
            }, 3000);
        }
    }
    game_over() {
        if (this.#is_sound === true) Game.#sound_manager.play('game_over');
        this.pause()
        this.#game_over = true;
        document.getElementById("player_score").innerHTML = this.#player.get_score();
        this.afficher_game_over();
    }
    afficher_game_over() {
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
        this.#stop_time_left();
        this.#tl_expires_at = null;
        this.#clearTimer(this.#bonus_id);
        if (this.#bonus_position != null) {
            const [bx, by] = this.#bonus_position;
            const [zx, zy] = this.#player.get_horde().get_position();
            if (!(bx === zx && by === zy)) {
                this.#matrice[bx][by] = 0;
            }
        }
        this.#bonus_position = null;
        this.#bonus_name = "";
        this.#bonus_id = null;
        this.#bonus_actif = true;
        this.#addTimer(() => {this.#bonus_actif = false}, Game.#temps_avant_nouveau_bonus);
    }
    clear_before_effect() {
        this.#stop_time_left();
        this.#clearTimer(this.#bonus_id);
        if (this.#bonus_position != null) {
            const [bx, by] = this.#bonus_position;
            const [zx, zy] = this.#player.get_horde().get_position();
            if (!(bx === zx && by === zy)) {
                this.#matrice[bx][by] = 0;
            }
        }
        this.#bonus_actif = true;
        this.#bonus_position = null;
        if (this.#bonus_name === 'etoile') this.#colision = false;
        this.#bonus_id = null;
    }
    prendre_bonus() {
        switch (this.#bonus_name) {
            case 'bombe'  : this.prendre_bombe();  break;
            case 'tnt'    : this.prendre_tnt();    break;
            case 'etoile' : this.prendre_etoile(); break;
            case 'vie'    : this.prendre_coeur();  break;
            case 'retro'  : this.prendre_retro();  break;

            case 'mago'   : this.prendre_mago();   break;
            case 'aspic'  : this.prendre_aspic();  break;
            case 'vito'   : this.prendre_vito();   break;
            case 'nobru'  : this.prendre_nobru();  break;
            case 'jekyll' : this.prendre_jekyll(); break;
        }
    }
    placement_bonus() {
        let bonus_val = Math.floor(Math.random() * 100);

        if (bonus_val >= 50 && bonus_val < 63 && this.#player.get_horde().get_size() > 10 && this.#allow_bombe) {
            this.placement_bombe(); // probabilité qu'une bombe spawn 13%
        }
        else if (bonus_val >= 63 && bonus_val < 75 && this.#player.get_horde().get_size() > 10 && this.#allow_etoile) {
            this.placement_etoile(); // probabilité qu'une étoile spawn 12%
        }
        else if (bonus_val >= 75 && bonus_val < 78 && this.#player.get_horde().get_size() > 15 && this.#allow_coeur && this.#player.get_vie() === 0) {
            this.placement_coeur(); // probabilité qu'un coeur spawn 3%
        }
        else if (bonus_val >= 78 && bonus_val < 80 && this.#player.get_horde().get_size() > 15 && this.#allow_retro) {
            this.placement_retro(); // probabilité que retro spawn 2%
        }
        else if (bonus_val >= 80 && bonus_val < 85 && this.#player.get_horde().get_size() > 20 && this.#allow_tnt) {
            this.placement_tnt(); // probabilité qu'une étoile spawn 5%
        }
        else if (bonus_val >= 85 && this.#player.get_score() > 149 && this.#allow_groupe) {
            // probabilité que le groupe sois choisi 15%
            let groupe = Math.floor(Math.random() * 26);
            if ( groupe > 12 ) {
                this.#allow_groupe = false
                this.#addTimer(() => {this.#allow_groupe = true}, Game.#temps_avant_apparition_groupe);
                if (groupe === 13 && this.#player.get_horde().get_size() > 20 && this.#allow_jekyll) {
                    this.placement_jekyll(); // probabilité que jekyll spawn 0.5%
                } else if (((groupe >= 14 && groupe < 17) || (groupe >= 23 && groupe < 26 && !this.#allow_vito)) && this.#allow_mago) {
                    this.placement_mago();   // probabilité que mago spawn  2%
                } else if (((groupe >= 17 && groupe < 20) || (groupe >= 14 && groupe < 17 && !this.#allow_mago)) && this.#player.get_horde().get_size() > 20 && this.#allow_nobru) {
                    this.placement_nobru();  // probabilité que nobru spawn 2%
                } else if (((groupe >= 20 && groupe < 23) || (groupe >= 17 && groupe < 20 && !this.#allow_nobru)) && this.#player.get_horde().get_size() > 20 && this.#allow_aspic) {
                    this.placement_aspic();  // probabilité que aspic spawn 2%
                } else if (((groupe >= 23 && groupe < 26) || (groupe >= 20 && groupe < 23 && !this.#allow_aspic)) && this.#player.get_horde().get_size() > 15 && this.#allow_vito) {
                    this.placement_vito();   // probabilité que vito spawn  2%
                }
            }
        }
    }


    // gestion bombe (retire trois zombies quand prise)
    prendre_bombe(){
        if (this.#is_sound === true) Game.#sound_manager.play("bombe");
        this.#stop_time_left();
        const membres_avant = [...this.#player.get_liste_membre()];
        let liste = this.#player.retirer_trois_zombie();
        if (liste.includes('retro_z')) {
            this.theme_zam_ii();
            this.#addTimer(() => {this.#retro_est_apparut = false}, Game.#temps_avant_apparition_retro);
        }
        for (const m of liste) {
            if (membres_avant.includes(m) && !this.#player.get_liste_membre().includes(m)) {
                for (let x = 0; x < Game.nb_case; x++) {
                    for (let y = 0; y < Game.nb_case; y++) {
                        if (this.#matrice[x][y] === m) this.#matrice[x][y] = 0;
                    }
                }
            }
        }
        this.membre_timeout(liste);
        this.#player.add_score(5);
        this.bombe_remove();
    }
    placement_bombe() {
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "bombe"
            this.#bonus_id = this.#addTimer(() => { this.bombe_remove() }, Game.#temps_avant_disparition_bombe);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "bombe";
            this.#start_time_left(Game.#temps_avant_disparition_bombe)
        }
    }
    bombe_remove() {
        this.#allow_bombe = false;
        this.#addTimer(() => {this.#allow_bombe = true}, Game.#temps_avant_apparition_bombe);
        this.clear_bonus();
    }
    // gestion tnt (retire tous les zombies de la horde)
    prendre_tnt(){
        if (this.#is_sound === true) Game.#sound_manager.play("tnt");
        const membres_en_horde = [...this.#player.get_liste_membre()];
        for (let x = 0; x < Game.nb_case; x++) {
            for (let y = 0; y < Game.nb_case; y++) {
                const v = this.#matrice[x][y];
                if (v !== 0 && (v.substring(0,4) === "zomb" || v === 'retro_z' || membres_en_horde.includes(v))) {
                    this.#matrice[x][y] = 0;
                }
            }
        }
        this.theme_zam_ii();
        this.#player.clear_horde();
        this.#retro_est_apparut = true;
        this.#addTimer(() => {this.#retro_est_apparut = false}, Game.#temps_avant_apparition_retro)
        this.membre_timeout(["mago", "aspic", "nobru", "vito", "jekyll"]);
        this.#player.add_score(50);
        this.tnt_remove();
    }
    placement_tnt(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "tnt"
            this.#bonus_id = this.#addTimer(() => { this.tnt_remove() }, Game.#temps_avant_disparition_tnt);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "tnt";
            this.#start_time_left(Game.#temps_avant_disparition_tnt);
        }
    }
    tnt_remove(){
        this.#allow_tnt = false;
        this.#addTimer(() => {this.#allow_tnt = true}, Game.#temps_avant_apparition_tnt);
        this.clear_bonus();
    }
    // gestion cœur (ajoute une vie)
    prendre_coeur(){
        if (this.#is_sound === true) Game.#sound_manager.play("vie");
        this.#player.gagner_vie();
        //this.#coeur_est_apparut = true;
        this.#player.add_score(20);
        this.coeur_remove();
    }
    placement_coeur(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "vie"
            this.#bonus_id = this.#addTimer(() => { this.coeur_remove() }, Game.#temps_avant_disparition_coeur);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "vie";
            this.#start_time_left(Game.#temps_avant_disparition_coeur)
        }
    }
    coeur_remove(){
        if (this.#coeur_est_apparut === false){
            this.#addTimer(() => {this.#allow_coeur = true}, Game.#temps_avant_apparition_coeur);
        }
        this.#allow_coeur = false;
        this.clear_bonus();
    }
    // gestion étoile (rend invincible sur un temps)
    prendre_etoile(){
        this.#start_time_left_actif(Game.#temps_effect_etoile);
        if (this.#is_sound === true) Game.#sound_manager.play("etoile")
        this.#clearTimer(this.#grace_timer);
        this.#grace_timer = null;
        this.clear_before_effect()
        this.#player.add_score(2);
        let board = document.getElementsByClassName('board')[0];
        if (!board.classList.contains('invincible')) board.classList.add('invincible');
        this.#addTimer(() => {
            this.#stop_time_left_actif();
            this.#colision = true;
            this.etoile_remove();
        }, Game.#temps_effect_etoile);
    }
    placement_etoile(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "etoile"
            this.#bonus_id = this.#addTimer(() => { this.etoile_remove() }, Game.#temps_avant_disparition_etoile);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "etoile";
            this.#start_time_left(Game.#temps_avant_disparition_etoile)
        }
    }
    etoile_remove(){
        this.#allow_etoile = false;
        this.#addTimer(() => {this.#allow_etoile = true}, Game.#temps_avant_apparition_etoile);
        let board = document.getElementsByClassName('board')[0];
        if (board.classList.contains('invincible')) board.classList.remove('invincible');
        this.clear_bonus();
    }
    // gestion retro (change le thème temps qu’il est dans la horde)
    prendre_retro(){
        if (this.#is_sound === true) Game.#sound_manager.play("retro");
        this.#retro_est_apparut = true;
        this.theme_retro_zam();
        this.#player.add_score(50);
        this.#player.ajouter_retro();
        this.retro_remove();
    }
    placement_retro(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "retro"
            this.#bonus_id = this.#addTimer(() => { this.retro_remove() }, Game.#temps_avant_disparition_retro);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "retro";
            this.#start_time_left(Game.#temps_avant_disparition_retro)
        }
    }
    retro_remove(){
        this.#allow_retro = false;
        this.#addTimer(() => {this.#allow_retro = true}, Game.#temps_avant_apparition_retro);
        this.clear_bonus();
    }

    /** --- [ gestion groupe ] --- **/
    membre_timeout(list){
        for (let x = 0; x < list.length; x++){
            switch (list[x]){
                case "mago"   : this.#allow_mago   = false; this.#addTimer(() => {this.#allow_mago   = true}, Game.#temps_avant_apparition_mago);   break;
                case "vito"   : this.#allow_vito   = false; this.#addTimer(() => {this.#allow_vito   = true}, Game.#temps_avant_apparition_vito);   break;
                case "nobru"  : this.#allow_nobru  = false; this.#addTimer(() => {this.#allow_nobru  = true}, Game.#temps_avant_apparition_nobru);  break;
                case "aspic"  : this.#allow_aspic  = false; this.#addTimer(() => {this.#allow_aspic  = true}, Game.#temps_avant_apparition_aspic);  break;
                case "jekyll" : this.#allow_jekyll = false; this.#addTimer(() => {this.#allow_jekyll = true}, Game.#temps_avant_apparition_jekyll); break;
            }
        }
    }
    // gestion mago (fuis loins de Zam)
    prendre_mago(){
        if (this.#is_sound === true) Game.#sound_manager.play("membre");
        this.clear_bonus();
        this.#player.ajouter_un_membre('mago');
        this.#allow_mago = false;
    }
    placement_mago(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "mago";
            this.#bonus_id = this.#addTimer(() => { this.mago_remove() }, Game.#temps_avant_disparition_mago);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "mago";
            this.#start_time_left(Game.#temps_avant_disparition_mago)
        }
    }
    move_mago() {
        if (this.#mago_a_bouger < 2) {
            this.#mago_a_bouger += 1;

            const x = this.#bonus_position[0];
            const y = this.#bonus_position[1];
            const zx = this.#player.get_horde().get_position()[0];
            const zy = this.#player.get_horde().get_position()[1];

            // Génère les 4 voisins triés du plus loin au plus proche de zam
            const voisins = [
                { nx: x - 1, ny: y },
                { nx: x + 1, ny: y },
                { nx: x,     ny: y - 1 },
                { nx: x,     ny: y + 1 },
            ].filter(({ nx, ny }) =>
                nx >= 0 && nx < Game.nb_case &&
                ny >= 0 && ny < Game.nb_case &&
                this.#matrice[nx][ny] === 0 // case libre uniquement
            ).sort((a, b) => {
                // distance Manhattan de chaque candidat à zam
                const da = Math.abs(a.nx - zx) + Math.abs(a.ny - zy);
                const db = Math.abs(b.nx - zx) + Math.abs(b.ny - zy);
                return db - da;  // décroissant = le plus loin d’abord
            });

            if (voisins.length > 0) {
                const { nx, ny } = voisins[0];  // meilleure case disponible
                this.#matrice[x][y] = 0;
                this.#bonus_position = [nx, ny];
                this.#matrice[nx][ny] = 'mago';
            }
        } else {
            this.#mago_a_bouger = 0;
        }
    }
    mago_remove(){
        this.clear_bonus();
        if (this.#allow_mago === true) {
            this.#allow_mago = false;
            this.#addTimer(() => {this.#allow_mago = true}, Game.#temps_avant_apparition_mago);
        }
    }
    // gestion vito (augmente la vitesse de déplacement de la horde sur une période donnée)
    prendre_vito(){
        this.#start_time_left_actif(Game.#temps_effect_vito);
        if (this.#is_sound === true) Game.#sound_manager.play("membre");
        this.#player.ajouter_un_membre('vito');
        this.clear_bonus();
        this.#player.add_score(100);
        this.#allow_vito = false;
        this.#bonus_vitesse = 0.5;
        clearInterval(this.#intervalId);
        this.#intervalId = setInterval(() => this.run(), Game.#vitesse * this.#bonus_vitesse);
        this.#addTimer(() => {
            this.#stop_time_left_actif();
            this.#bonus_vitesse = 1;
            clearInterval(this.#intervalId);
            this.#intervalId = setInterval(() => this.run(), Game.#vitesse);
            this.vito_remove();
        }, Game.#temps_effect_vito);
    }
    placement_vito(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "vito"
            this.#bonus_id = this.#addTimer(() => { this.vito_remove(); }, Game.#temps_avant_disparition_vito);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "vito";
            this.#start_time_left(Game.#temps_avant_disparition_vito)
        }
    }
    vito_remove(){
        this.clear_bonus();
        if (this.#allow_vito === true) {
            this.#allow_vito = false;
            this.#addTimer(() => {this.#allow_vito = true}, Game.#temps_avant_apparition_vito);
        }
    }
    // gestion nobru (freeze la horde pour permettre de tuer un maximum de zombie)
    prendre_nobru(){
        this.#start_time_left_actif(Game.#temps_effect_nobru);
        this.clear_bonus();
        this.#allow_nobru = false;
        this.#freeze = true;
        this.#addTimer(() => {
            if (this.#is_sound === true) Game.#sound_manager.play("membre");
            this.#player.ajouter_un_membre('nobru');
            this.#player.add_score(100);
            this.#stop_time_left_actif();
            this.#freeze = false; }, Game.#temps_effect_nobru);
    }
    placement_nobru(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "nobru"
            this.#bonus_id = this.#addTimer(() => { this.nobru_remove(); }, Game.#temps_avant_disparition_nobru);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "nobru";
            this.#start_time_left(Game.#temps_avant_disparition_nobru)
        }
    }
    kill_z() {
        if (this.#nobru_click < Game.#nb_click_kill) {
            this.#nobru_click += 1;
        } else {
            if (this.#player.get_horde().get_size() > 1 ) {
                this.#nobru_click = 0;
                this.#player.retirer_un_zombie();
            }
        }
    }
    nobru_remove(){
        this.clear_bonus();
        if (this.#allow_nobru === true) {
            this.#allow_nobru = false;
            this.#addTimer(() => {this.#allow_nobru = true}, Game.#temps_avant_apparition_nobru);
        }
    }
    // gestion aspic (transforme les cerveaux en pizza sur un temps donnés)
    prendre_aspic(){
        this.#start_time_left_actif(Game.#temps_effect_aspic);
        if (this.#is_sound === true) Game.#sound_manager.play("membre");
        this.clear_before_effect();
        this.#player.add_score(80);
        this.#player.ajouter_un_membre('aspic');
        this.#allow_aspic = false;
        this.#est_pizza = true;
        this.#matrice[this.#position_cerveau[0]][this.#position_cerveau[1]] = 'pizza'
        this.#addTimer(() => {
            this.#stop_time_left_actif();
            this.#est_pizza = false;
            this.#matrice[this.#position_cerveau[0]][this.#position_cerveau[1]] = 'cerveau'
            this.aspic_remove()
        }, Game.#temps_effect_aspic);
    }
    placement_aspic(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "aspic"
            this.#bonus_id = this.#addTimer(() => { this.aspic_remove(); }, Game.#temps_avant_disparition_aspic);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "aspic";
            this.#start_time_left(Game.#temps_avant_disparition_aspic)
        }
    }
    aspic_remove(){
        this.clear_bonus();
        if (this.#allow_aspic === true) {
            this.#allow_aspic = false;
            this.#addTimer(() => {this.#allow_aspic = true}, Game.#temps_avant_apparition_aspic);
        }
    }
    // gestion jekyll (change de sens la horde sur un temps donnés)
    prendre_jekyll(){
        this.#start_time_left_actif(Game.#temps_effect_jekyll);
        if (this.#is_sound === true) Game.#sound_manager.play("membre");
        this.#player.ajouter_un_membre('jekyll');
        this.clear_before_effect();
        this.#player.add_score(200);
        this.#player.inverser_horde();
        this.#allow_jekyll = false;
        this.#addTimer(() => {
            this.#stop_time_left_actif();
            this.#player.inverser_horde();
            this.#colision = true;
            this.jekyll_remove();
        }, Game.#temps_effect_jekyll);
    }
    placement_jekyll(){
        if (!this.#bonus_actif) {
            this.#bonus_actif = true;
            this.#bonus_position = this.#placement_item();
            this.#bonus_name = "jekyll"
            this.#bonus_id = this.#addTimer(() => { this.jekyll_remove(); }, Game.#temps_avant_disparition_jekyll);
            this.#matrice[this.#bonus_position[0]][this.#bonus_position[1]] = "jekyll";
            this.#start_time_left(Game.#temps_avant_disparition_jekyll)
        }
    }
    jekyll_remove(){
        this.clear_bonus();
        if (this.#allow_jekyll === true) {
            this.#allow_jekyll = false;
            this.#addTimer(() => {this.#allow_jekyll = true}, Game.#temps_avant_apparition_jekyll);
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
            if (this.#is_sound === true) Game.#sound_manager.play("cerveau")
            this.#player.ajouter_un_zombie();
        } else {
            this.update_score(15);
            if (this.#is_sound === true) Game.#sound_manager.play("pizza")
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
}