document.addEventListener("DOMContentLoaded", async () => {

    const carousel = document.getElementById(
        "home-actions-preview"
    );

    if (!carousel) {
        return;
    }

    let medias = [];
    let currentGroup = 0;
    let autoSlideInterval = null;

    const GROUP_SIZE = 3;
    const MAX_MEDIAS = 9;
    const SLIDE_DELAY = 15000;

    // ============================================================
    // UTILITAIRES
    // ============================================================

    function getMediaType(media) {

        if (media?.type) {
            return String(media.type).toLowerCase();
        }

        const fileName =
            media?.file ||
            "";

        const extension =
            fileName
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

        if (
            imageExtensions.includes(
                extension
            )
        ) {
            return "image";
        }

        if (
            videoExtensions.includes(
                extension
            )
        ) {
            return "video";
        }

        return "file";
    }


   function getMediaUrl(media) {

    if (
        !media ||
        !media.file
    ) {
        return "";
    }

    return `assets/image-apam/${encodeURIComponent(media.file)}`;
} 


    // ============================================================
    // CHARGEMENT DES MÉDIAS
    // ============================================================

    try {

        const response =
            await fetch(
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

        const data =
            await response.json();

        if (
            !Array.isArray(data)
        ) {
            throw new Error(
                "images.json ne contient pas une liste."
            );
        }

        // --------------------------------------------------------
        // Les plus récemment synchronisés en premier
        // --------------------------------------------------------

        medias =
            data
                .filter(
                    (media) =>
                        media &&
                        media.file &&
                        media.synced_at
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.synced_at
                        ) -
                        new Date(
                            a.synced_at
                        )
                )
                .slice(
                    0,
                    MAX_MEDIAS
                );

        // --------------------------------------------------------
        // Si aucun média exploitable
        // --------------------------------------------------------

        if (
            medias.length === 0
        ) {

            carousel.innerHTML = `
                <p class="gallery-empty">
                    Aucun média disponible
                    pour le moment.
                </p>
            `;

            return;
        }

        // --------------------------------------------------------
        // Construction du carrousel
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
    // CARROUSEL
    // ============================================================

    function getGroupCount() {

        return Math.ceil(
            medias.length /
            GROUP_SIZE
        );
    }


    function buildCarousel() {

        carousel.innerHTML = "";

        // --------------------------------------------------------
        // Zone d'affichage
        // --------------------------------------------------------

        const viewport =
            document.createElement(
                "div"
            );

        viewport.className =
            "home-actions-viewport";


        const track =
            document.createElement(
                "div"
            );

        track.className =
            "home-actions-track";


        viewport.appendChild(
            track
        );

        carousel.appendChild(
            viewport
        );


        // --------------------------------------------------------
        // Flèche précédente
        // --------------------------------------------------------

        const prevButton =
            document.createElement(
                "button"
            );

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
        // Flèche suivante
        // --------------------------------------------------------

        const nextButton =
            document.createElement(
                "button"
            );

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
        // Indicateurs
        // --------------------------------------------------------

        const dots =
            document.createElement(
                "div"
            );

        dots.className =
            "home-actions-dots";

        carousel.appendChild(
            dots
        );


        for (
            let i = 0;
            i < getGroupCount();
            i++
        ) {

            const dot =
                document.createElement(
                    "button"
                );

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

            dots.appendChild(
                dot
            );
        }


        // --------------------------------------------------------
        // Génération des 9 médias
        // --------------------------------------------------------

        medias.forEach(
            (media) => {

                const item =
                    document.createElement(
                        "article"
                    );

                item.className =
                    "home-actions-item";


                const type =
                    getMediaType(
                        media
                    );


                // ------------------------------------------------
                // IMAGE
                // ------------------------------------------------

                if (
                    type === "image"
                ) {

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.src =
                        getMediaUrl(
                            media
                        );

                    image.alt =
                        media.title ||
                        "Photo de l'APAM";

                    image.loading =
                        "lazy";

                    item.appendChild(
                        image
                    );
                }


                // ------------------------------------------------
                // VIDÉO
                // ------------------------------------------------

                else if (
                    type === "video"
                ) {

                    const video =
                        document.createElement(
                            "video"
                        );

                    video.src =
                        getMediaUrl(
                            media
                        );

                    video.muted =
                        true;

                    video.playsInline =
                        true;

                    video.preload =
                        "metadata";

                    // Pas de contrôles,
                    // pas d'autoplay.
                    video.controls =
                        false;

                    item.appendChild(
                        video
                    );
                }


                // ------------------------------------------------
                // AUTRE TYPE
                // ------------------------------------------------

                else {

                    const placeholder =
                        document.createElement(
                            "div"
                        );

                    placeholder.className =
                        "home-actions-file";

                    placeholder.textContent =
                        media.title ||
                        "Média APAM";

                    item.appendChild(
                        placeholder
                    );
                }


                track.appendChild(
                    item
                );
            }
        );


        // --------------------------------------------------------
        // Première position
        // --------------------------------------------------------

        showGroup(
            0
        );
    }


    // ============================================================
    // AFFICHAGE D'UN GROUPE
    // ============================================================

    function showGroup(
        groupIndex
    ) {

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

        currentGroup =
            (
                groupIndex +
                groupCount
            ) %
            groupCount;


        const offset =
            currentGroup * 100;

        track.style.transform =
            `translateX(-${offset}%)`;


        dots.forEach(
            (
                dot,
                index
            ) => {

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

        if (
            getGroupCount() <= 1
        ) {
            return;
        }

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


    function stopAutoSlide() {

        if (
            autoSlideInterval
        ) {

            clearInterval(
                autoSlideInterval
            );

            autoSlideInterval =
                null;
        }
    }

});