export class Sound_manager{
    #audio;
    #is_playing;
    #sounds;

    constructor() {
        this.#audio = new Audio();
        this.#is_playing = false;
        this.#init_sounds();
    }

    play(son) {
        if (son in this.#sounds) {
            this.#audio.src = this.#sounds[son][0]
            this.#audio.volume = this.#sounds[son][1]
            this.#audio.play().catch(error => {});
        }
    }
    #init_sounds(){
        this.#sounds = {
            'bombe'     : ['./ressources/sons/bombe.mp3',        0.50],
            'membre'    : ['./ressources/sons/bonus-membre.mp3', 0.50],
            'cerveau'   : ['./ressources/sons/cerveau.mp3',      0.50],
            'mouvement' : ['./ressources/sons/direction.mp3',    0.25],
            'etoile'    : ['./ressources/sons/etoile.mp3',       0.50],
            'pizza'     : ['./ressources/sons/pizza.mp3',        0.50],
            'tnt'       : ['./ressources/sons/tnt.mp3',          0.50],
            'vie'       : ['./ressources/sons/vie.mp3',          0.50],
            'game_over' : ['./ressources/sons/gameover.mp3',     0.50],
            'vie_perdu' : ['./ressources/sons/vie_perdu.mp3',    0.40],
            'retro'     : ['./ressources/sons/retro.mp3',        1   ],
        }
    }
}