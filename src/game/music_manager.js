export class Music_manager {
    #tracks;
    #current_track_id;
    #audio;
    #is_playing;
    #volume;

    constructor() {
        this.#init_tracks();
        this.#current_track_id = 0;
        this.#audio = new Audio();
        this.#is_playing = false;
        this.#volume = 0.5;
        this.#audio.volume = this.#volume;


        this.load_track(this.#current_track_id);
        //this.render_track_list();
        this.setup_event_listeners();
    }

    load_track() {
        if (this.#current_track_id < 0) { this.#current_track_id = this.#tracks.length() - 1; }
        if (this.#current_track_id >= this.#tracks.length) { this.#current_track_id = 0; }
        const track = this.#tracks[this.#current_track_id];
        this.#audio.src = track.fichier;
        this.#audio.load();
    }

    render_track_list(){
        this.#tracks.forEach((track, index) => {
            console.log(track.titre);
        });
    }

    setup_event_listeners(){}

    #init_tracks(){
        this.#tracks = [
            {titre:'L3 CR0QU3-M1TA1N3', fichier:'./ressources/ost/le_croque_mitaine.mp3'},
            {titre:'G33K', fichier:'./ressources/ost/geek.mp3'},
            {titre:'L@ RUM3UR', fichier:'./ressources/ost/la_rumeur.mp3'},
            {titre:'6 P13DS S0US T3RR3', fichier:'./ressources/ost/six_pieds_sous_terre.mp3'},
            {titre:'L3S Z0MB13S', fichier:'./ressources/ost/les_zombies.mp3'},
            {titre:'PAND3M1A', fichier:'./ressources/ost/pandemia.mp3'},
            {titre:'SUP3R KRAK3N W0RLD', fichier:'./ressources/ost/super_kraken_world.mp3'},
        ];
        this.#tracks.sort(() => Math.random() - 0.5);
    }

    play(){
        if (!this.#is_playing) {
            this.#audio.play()
                .then(()=>{
                    this.#is_playing = true;
                    }
                )
                .catch(error => {
                console.error("Erreur de lecture :", error);
            });
        }
    }
    pause(){
        if (this.#is_playing) {
            this.#audio.pause();
            this.#is_playing = false;
        }
    }

    next() {
        this.#current_track_id = this.#current_track_id + 1;
        this.load_track();
    }
}