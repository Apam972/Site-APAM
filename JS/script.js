```js
document.addEventListener("DOMContentLoaded", async () => {

    const carousel = document.getElementById(
        "home-actions-preview"
    );

    if (!carousel) {
        return;
    }


    // ============================================================
    // CONFIGURATION
    // ============================================================

    const GROUP_SIZE = 3;
    const MAX_MEDIAS = 9;
    const SLIDE_DELAY = 15000;

    let medias = [];
    let currentGroup = 0;
    let autoSlideInterval = null;


    // ============================================================
    // UTILITAIRES
    // ============================================================

    function getMediaType(media) {

        if (media?.type) {
            return String(media.type).toLowerCase();
        }

        const fileName = media?.file || "";

        const extension = fileName
            .split(".")
            .pop()
            .toLowerCase();

        const imageExtensions = [
            "jpg",
            "jpeg",
            "png",
            "webp",
            "gif",
            "bmp",
            "svg"
        ];

        const videoExtensions = [
            "mp4",
            "webm",
            "mov",
            "avi",
            "mkv"
        ];

        if (imageExtensions.includes(extension)) {
            return "image";
        }

        if (videoExtensions.includes(extension)) {
            return "video";
        }

        return "file";
    }


    function getMediaUrl(media) {

        if (!media?.file) {
            return "";
        }

        return (
            `assets/image-apam/${encodeURIComponent(media.file)}`
        );
    }


    // ============================================================
    // CHARGEMENT DES MÉDIAS
    // ============================================================

    try {

        const response = await fetch(
            `data/images.json?ts=${Date.now()}`,
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "images.json ne contient pas une liste."
            );
        }


        // --------------------------------------------------------
        // TRI PAR DATE DE SYNCHRONISATION
        // --------------------------------------------------------

        medias = data
            .filter(
                media =>
                    media &&
                    media.file &&
                    media.synced_at
            )
            .sort(
                (a, b) =>
                    new Date(b.synced_at) -
                    new Date(a.synced_at)
            )
            .slice(
                0,
                MAX_MEDIAS
            );


        // --------------------------------------------------------
        // AUCUN MÉDIA
        // --------------------------------------------------------

        if (medias.length === 0) {

            carousel.innerHTML = `
                <p class="gallery-empty">
                    Aucun média disponible
                    pour le moment.
                </p>
            `;

            return;
        }


        // --------------------------------------------------------
        // CONSTRUCTION
        // --------------------------------------------------------

        buildCarousel();

        startAutoSlide();

    } catch (error) {

        console.error(
            "Impossible de charger le carrousel APAM :",
            error
        );

        carousel.innerHTML = `
            <p class="gallery-error">
                Impossible de charger
                les médias.
            </p>
        `;
    }


    // ============================================================
    // NOMBRE DE GROUPES
    // ============================================================

    function getGroupCount() {

        return Math.ceil(
            medias.length / GROUP_SIZE
        );
    }


    // ============================================================
    // CONSTRUCTION DU CARROUSEL
    // ============================================================

    function buildCarousel() {

        carousel.innerHTML = "";


        // --------------------------------------------------------
        // VIEWPORT
        // --------------------------------------------------------

        const viewport =
            document.createElement("div");

        viewport.className =
            "home-actions-viewport";


        // --------------------------------------------------------
        // TRACK
        // --------------------------------------------------------

        const track =
            document.createElement("div");

        track.className =
            "home-actions-track";


        viewport.appendChild(track);

        carousel.appendChild(viewport);


        // --------------------------------------------------------
        // CARTES
        // --------------------------------------------------------

        medias.forEach(media => {

            const item =
                document.createElement("article");

            item.className =
                "home-actions-item";


            const type =
                getMediaType(media);


            // ====================================================
            // IMAGE
            // ====================================================

            if (type === "image") {

                const image =
                    document.createElement("img");

                image.src =
                    getMediaUrl(media);

                image.alt =
                    media.title ||
                    "Photo de l'APAM";

                image.loading =
                    "lazy";

                item.appendChild(image);
            }


            // ====================================================
            // VIDÉO
            // ====================================================

            else if (type === "video") {

                const video =
                    document.createElement("video");

                video.src =
                    getMediaUrl(media);

                video.muted =
                    true;

                video.playsInline =
                    true;

                video.preload =
                    "metadata";

                video.controls =
                    false;

                /*
                 * La vidéo ne se lance pas.
                 *
                 * On la positionne simplement sur
                 * sa première image disponible.
                 */

                video.addEventListener(
                    "loadedmetadata",
                    () => {

                        try {

                            video.currentTime = 0;

                        } catch (error) {

                            console.warn(
                                "Impossible de positionner la miniature vidéo.",
                                error
                            );
                        }
                    }
                );

                item.appendChild(video);
            }


            // ====================================================
            // AUTRE TYPE
            // ====================================================

            else {

                const placeholder =
                    document.createElement("div");

                placeholder.className =
                    "home-actions-file";

                placeholder.textContent =
                    media.title ||
                    "Média APAM";

                item.appendChild(
                    placeholder
                );
            }


            track.appendChild(item);
        });


        // --------------------------------------------------------
        // FLÈCHE PRÉCÉDENTE
        // --------------------------------------------------------

        const prevButton =
            document.createElement("button");

        prevButton.type =
            "button";

        prevButton.className =
            "home-actions-prev";

        prevButton.setAttribute(
            "aria-label",
            "Médias précédents"
        );

        prevButton.innerHTML =
            "‹";


        prevButton.addEventListener(
            "click",
            () => {

                stopAutoSlide();

                showGroup(
                    currentGroup - 1
                );

                startAutoSlide();
            }
        );


        // --------------------------------------------------------
        // FLÈCHE SUIVANTE
        // --------------------------------------------------------

        const nextButton =
            document.createElement("button");

        nextButton.type =
            "button";

        nextButton.className =
            "home-actions-next";

        nextButton.setAttribute(
            "aria-label",
            "Médias suivants"
        );

        nextButton.innerHTML =
            "›";


        nextButton.addEventListener(
            "click",
            () => {

                stopAutoSlide();

                showGroup(
                    currentGroup + 1
                );

                startAutoSlide();
            }
        );


        carousel.appendChild(
            prevButton
        );

        carousel.appendChild(
            nextButton
        );


        // --------------------------------------------------------
        // DOTS
        // --------------------------------------------------------

        const dots =
            document.createElement("div");

        dots.className =
            "home-actions-dots";


        for (
            let i = 0;
            i < getGroupCount();
            i++
        ) {

            const dot =
                document.createElement("button");

            dot.type =
                "button";

            dot.className =
                "home-actions-dot";

            dot.setAttribute(
                "aria-label",
                `Afficher le groupe ${i + 1}`
            );


            dot.addEventListener(
                "click",
                () => {

                    stopAutoSlide();

                    showGroup(i);

                    startAutoSlide();
                }
            );


            dots.appendChild(dot);
        }


        carousel.appendChild(
            dots
        );


        // --------------------------------------------------------
        // PREMIER GROUPE
        // --------------------------------------------------------

        showGroup(0);
    }


    // ============================================================
    // AFFICHER UN GROUPE
    // ============================================================

    function showGroup(groupIndex) {

        const track =
            carousel.querySelector(
                ".home-actions-track"
            );

        const dots =
            carousel.querySelectorAll(
                ".home-actions-dot"
            );


        if (!track) {
            return;
        }


        const groupCount =
            getGroupCount();


        if (groupCount <= 0) {
            return;
        }


        // --------------------------------------------------------
        // BOUCLE
        // --------------------------------------------------------

        currentGroup =
            (
                groupIndex +
                groupCount
            ) %
            groupCount;


        // --------------------------------------------------------
        // DÉPLACEMENT
        // --------------------------------------------------------

        const offset =
            currentGroup * 100;


        track.style.transform =
            `translateX(-${offset}%)`;


        // --------------------------------------------------------
        // DOT ACTIF
        // --------------------------------------------------------

        dots.forEach(
            (dot, index) => {

                dot.classList.toggle(
                    "active",
                    index === currentGroup
                );
            }
        );
    }


    // ============================================================
    // DÉFILEMENT AUTOMATIQUE
    // ============================================================

    function startAutoSlide() {

        if (getGroupCount() <= 1) {
            return;
        }


        stopAutoSlide();


        autoSlideInterval =
            setInterval(
                () => {

                    showGroup(
                        currentGroup + 1
                    );

                },
                SLIDE_DELAY
            );
    }


    // ============================================================
    // ARRÊT AUTOMATIQUE
    // ============================================================

    function stopAutoSlide() {

        if (autoSlideInterval) {

            clearInterval(
                autoSlideInterval
            );

            autoSlideInterval =
                null;
        }
    }

});
```
