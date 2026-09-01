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
        // Aucun média
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
        // Construction
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
            medias.length /
            GROUP_SIZE
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
            document.createElement(
                "div"
            );

        viewport.className =
            "home-actions-viewport";


        // --------------------------------------------------------
        // TRACK
        // --------------------------------------------------------

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
        // DOTS
        // --------------------------------------------------------

        const dots =
            document.createElement(
                "div"
            );

        dots.className =
            "home-actions-dots";


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


        carousel.appendChild(
            dots
        );


        // --------------------------------------------------------
        // MÉDIAS
        // --------------------------------------------------------

        medias.forEach(
            (media) => {

                const item =
                    document.createElement(
                        "article"
                    );

                item.className =
                    "home-actions-item";

                item.setAttribute(
                    "tabindex",
                    "0"
                );

                item.setAttribute(
                    "role",
                    "link"
                );

                item.setAttribute(
                    "aria-label",
                    `Voir ${media.title || "ce média"} dans les actions`
                );


                // ------------------------------------------------
                // CLIC → PAGE ACTIONS
                // ------------------------------------------------

                function openMediaPage() {

                    const target =
                        `actions/actions.html?media=${encodeURIComponent(
                            media.file
                        )}`;

                    window.location.href =
                        target;
                }


                item.addEventListener(
                    "click",
                    openMediaPage
                );


                // ------------------------------------------------
                // CLAVIER
                // ------------------------------------------------

                item.addEventListener(
                    "keydown",
                    (event) => {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            openMediaPage();
                        }

                        if (
                            event.key ===
                            " "
                        ) {

                            event.preventDefault();

                            openMediaPage();
                        }
                    }
                );


                const type =
                    getMediaType(
                        media
                    );


                // =================================================
                // IMAGE
                // =================================================

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

                    image.draggable =
                        false;

                    item.appendChild(
                        image
                    );
                }


                // =================================================
                // VIDÉO
                // =================================================

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

                    video.controls =
                        false;


                    // ------------------------------------------------
                    // Première image de la vidéo
                    // ------------------------------------------------

                    video.addEventListener(
                        "loadedmetadata",
                        () => {

                            try {

                                video.currentTime =
                                    0;

                            } catch (error) {

                                console.warn(
                                    "Impossible de positionner la miniature vidéo.",
                                    error
                                );
                            }
                        }
                    );


                    item.appendChild(
                        video
                    );
                }


                // =================================================
                // AUTRE TYPE
                // =================================================

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
        // PREMIÈRE POSITION
        // --------------------------------------------------------

        showGroup(
            0
        );
    }


    // ============================================================
    // AFFICHER UN GROUPE
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


        if (
            groupCount <= 0
        ) {
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
// ============================================================
// ACTUALITÉS — APERÇU INDEX
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const newsPreview =
            document.getElementById(
                "home-news-preview"
            );


        if (!newsPreview) {
            return;
        }


        const JSON_URL =
            "data/actualites.json";


        // ========================================================
        // UTILITAIRE — FORMATAGE DE LA DATE
        // ========================================================

        function formatNewsDate(
            dateString
        ) {

            if (!dateString) {
                return "";
            }


            const date =
                new Date(
                    `${dateString}T00:00:00`
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return dateString;
            }


            return new Intl.DateTimeFormat(
                "fr-FR",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ).format(
                date
            );
        }


        // ========================================================
        // UTILITAIRE — EXTRAIT
        // ========================================================

        function getNewsExcerpt(
            content,
            maxLength = 100
        ) {

            const text =
                String(
                    content || ""
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


            if (!text) {
                return "";
            }


            if (
                text.length <= maxLength
            ) {

                return text;
            }


            return (
                text
                    .slice(
                        0,
                        maxLength
                    )
                    .trimEnd()
                + "..."
            );
        }


        // ========================================================
        // CRÉATION D'UNE CARTE
        // ========================================================

        function createNewsPreview(
            news
        ) {

            const link =
                document.createElement(
                    "a"
                );


            link.className =
                "home-news-item";


            link.href =
                "actualites/actualites.html";


            link.setAttribute(
                "aria-label",
                `Lire l'actualité : ${
                    news.title || "Actualité"
                }`
            );


            // ====================================================
            // IMAGE
            // ====================================================

            const imageContainer =
                document.createElement(
                    "div"
                );


            imageContainer.className =
                "home-news-item-image";


            if (news.cover) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    news.cover;


                image.alt =
                    news.title ||
                    "Actualité de l'APAM";


                image.loading =
                    "lazy";


                image.draggable =
                    false;


                imageContainer.appendChild(
                    image
                );

            } else {

                imageContainer.textContent =
                    "APAM";
            }


            // ====================================================
            // CONTENU
            // ====================================================

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "home-news-item-content";


            // ----------------------------------------------------
            // DATE
            // ----------------------------------------------------

            const date =
                document.createElement(
                    "p"
                );


            date.className =
                "home-news-item-date";


            date.textContent =
                formatNewsDate(
                    news.date
                );


            // ----------------------------------------------------
            // TITRE
            // ----------------------------------------------------

            const title =
                document.createElement(
                    "h3"
                );


            title.className =
                "home-news-item-title";


            title.textContent =
                news.title ||
                "Actualité";


            // ----------------------------------------------------
            // EXTRAIT
            // ----------------------------------------------------

            const excerpt =
                document.createElement(
                    "p"
                );


            excerpt.className =
                "home-news-item-excerpt";


            excerpt.textContent =
                getNewsExcerpt(
                    news.content
                );


            // ----------------------------------------------------
            // ASSEMBLAGE
            // ----------------------------------------------------

            content.appendChild(
                date
            );

            content.appendChild(
                title
            );

            content.appendChild(
                excerpt
            );


            link.appendChild(
                imageContainer
            );

            link.appendChild(
                content
            );


            return link;
        }


        // ========================================================
        // CHARGEMENT DES ACTUALITÉS
        // ========================================================

        try {

            const response =
                await fetch(
                    `${JSON_URL}?ts=${Date.now()}`,
                    {
                        cache:
                            "no-store"
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
                    "actualites.json ne contient pas une liste."
                );
            }


            // ====================================================
            // TRI — PLUS RÉCENT → PLUS ANCIEN
            // ====================================================

            const latestNews =
                data
                    .filter(
                        (news) =>
                            news &&
                            news.title &&
                            news.date
                    )
                    .sort(
                        (a, b) =>
                            new Date(
                                `${b.date}T00:00:00`
                            ) -
                            new Date(
                                `${a.date}T00:00:00`
                            )
                    )
                    .slice(
                        0,
                        4
                    );


            // ====================================================
            // AUCUNE ACTUALITÉ
            // ====================================================

            if (
                latestNews.length === 0
            ) {

                newsPreview.innerHTML = `
                    <p class="gallery-empty">
                        Aucune actualité disponible
                        pour le moment.
                    </p>
                `;

                return;
            }


            // ====================================================
            // AFFICHAGE
            // ====================================================

            newsPreview.innerHTML =
                "";


            latestNews.forEach(
                (news) => {

                    const card =
                        createNewsPreview(
                            news
                        );


                    newsPreview.appendChild(
                        card
                    );
                }
            );


        } catch (error) {

            console.error(
                "Impossible de charger les actualités de l'index :",
                error
            );


            newsPreview.innerHTML = `
                <p class="gallery-error">
                    Impossible de charger
                    les actualités.
                </p>
            `;
        }

    }
);