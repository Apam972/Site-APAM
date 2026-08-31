document.addEventListener("DOMContentLoaded", async () => {

    const gallery = document.getElementById("apam-gallery");

    let currentIndex = 0;
    let images = [];

    if (!gallery) {
        return;
    }


    // ========================================================
    // UTILITAIRES
    // ========================================================

    function getMediaType(mimeType) {

        if (!mimeType) {
            return "file";
        }

        if (mimeType.startsWith("image/")) {
            return "image";
        }

        if (mimeType.startsWith("video/")) {
            return "video";
        }

        if (mimeType.startsWith("audio/")) {
            return "audio";
        }

        if (mimeType === "application/pdf") {
            return "pdf";
        }

        return "file";
    }


    function formatDate(dateString) {

        if (!dateString) {
            return "";
        }

        const date = new Date(
            `${dateString}T00:00:00`
        );

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);
    }


    function getMediaTypeFromFile(fileName) {

        if (!fileName) {
            return "file";
        }

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


        const audioExtensions = [
            "mp3",
            "wav",
            "ogg"
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


        if (
            audioExtensions.includes(
                extension
            )
        ) {
            return "audio";
        }


        if (extension === "pdf") {
            return "pdf";
        }


        return "file";
    }


    function getItemType(media) {

        if (media.type) {
            return media.type;
        }

        return getMediaTypeFromFile(
            media.file
        );
    }


    // ========================================================
    // LIGHTBOX
    // ========================================================

    const lightbox =
        document.getElementById(
            "photo-lightbox"
        );


    const closeButton =
        document.querySelector(
            ".lightbox-close"
        );


    const prevButton =
        document.querySelector(
            ".lightbox-prev"
        );


    const nextButton =
        document.querySelector(
            ".lightbox-next"
        );


    let lightboxMediaContainer = null;


    if (lightbox) {

        lightboxMediaContainer =
            lightbox.querySelector(
                ".lightbox-media"
            );


        if (!lightboxMediaContainer) {

            lightboxMediaContainer =
                document.createElement(
                    "div"
                );

            lightboxMediaContainer.className =
                "lightbox-media";

            lightboxMediaContainer.setAttribute(
                "aria-live",
                "polite"
            );

            lightbox.appendChild(
                lightboxMediaContainer
            );
        }
    }


    // ========================================================
    // AFFICHAGE DU MÉDIA DANS LA LIGHTBOX
    // ========================================================

    function renderLightboxMedia(media) {

        if (!lightboxMediaContainer) {
            return;
        }


        lightboxMediaContainer.innerHTML =
            "";


        // ----------------------------------------------------
        // CONTENEURS
        // ----------------------------------------------------

        const mediaContent =
            document.createElement(
                "div"
            );

        mediaContent.className =
            "lightbox-media-content";


        const info =
            document.createElement(
                "div"
            );

        info.className =
            "lightbox-info";


        // ----------------------------------------------------
        // INFORMATIONS
        // ----------------------------------------------------

        const titleText =
            media.title || "";


        const descriptionText =
            media.description || "";


        const dateText =
            media.date || "";


        if (titleText) {

            const titleElement =
                document.createElement(
                    "h2"
                );

            titleElement.className =
                "lightbox-title";

            titleElement.textContent =
                titleText;

            info.appendChild(
                titleElement
            );
        }


        if (dateText) {

            const dateElement =
                document.createElement(
                    "p"
                );

            dateElement.className =
                "lightbox-date";

            dateElement.textContent =
                formatDate(
                    dateText
                );

            info.appendChild(
                dateElement
            );
        }


        if (descriptionText) {

            const descriptionElement =
                document.createElement(
                    "p"
                );

            descriptionElement.className =
                "lightbox-description";

            descriptionElement.textContent =
                descriptionText;

            info.appendChild(
                descriptionElement
            );
        }


        // ----------------------------------------------------
        // SOURCE
        // ----------------------------------------------------

        const source =
            `../assets/image-apam/${media.file}`;


        const title =
            media.title ||
            "Média de l'APAM";


        const type =
            getItemType(media);


        // ----------------------------------------------------
        // IMAGE
        // ----------------------------------------------------

        if (type === "image") {

            const imageElement =
                document.createElement(
                    "img"
                );

            imageElement.className =
                "lightbox-image";

            imageElement.src =
                source;

            imageElement.alt =
                title;

            imageElement.loading =
                "eager";


            mediaContent.appendChild(
                imageElement
            );
        }


        // ----------------------------------------------------
        // VIDÉO
        // ----------------------------------------------------

        else if (type === "video") {

            const videoElement =
                document.createElement(
                    "video"
                );

            videoElement.className =
                "lightbox-video";

            videoElement.src =
                source;

            videoElement.controls =
                true;

            videoElement.autoplay =
                true;

            videoElement.playsInline =
                true;

            videoElement.preload =
                "metadata";

            videoElement.setAttribute(
                "aria-label",
                title
            );


            mediaContent.appendChild(
                videoElement
            );
        }


        // ----------------------------------------------------
        // AUDIO
        // ----------------------------------------------------

        else if (type === "audio") {

            const audioElement =
                document.createElement(
                    "audio"
                );

            audioElement.className =
                "lightbox-audio-player";

            audioElement.controls =
                true;

            audioElement.autoplay =
                true;

            audioElement.preload =
                "metadata";

            audioElement.src =
                source;


            mediaContent.appendChild(
                audioElement
            );
        }


        // ----------------------------------------------------
        // PDF
        // ----------------------------------------------------

        else if (type === "pdf") {

            const link =
                document.createElement(
                    "a"
                );

            link.className =
                "lightbox-file-link";

            link.href =
                source;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                `Ouvrir le PDF : ${title}`;


            mediaContent.appendChild(
                link
            );
        }


        // ----------------------------------------------------
        // AUTRE FICHIER
        // ----------------------------------------------------

        else {

            const link =
                document.createElement(
                    "a"
                );

            link.className =
                "lightbox-file-link";

            link.href =
                source;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                `Ouvrir le fichier : ${title}`;


            mediaContent.appendChild(
                link
            );
        }


        // ----------------------------------------------------
        // AJOUT À LA LIGHTBOX
        // ----------------------------------------------------

        lightboxMediaContainer.appendChild(
            mediaContent
        );


        if (info.children.length > 0) {

            lightboxMediaContainer.appendChild(
                info
            );
        }
    }


    // ========================================================
    // OUVERTURE LIGHTBOX
    // ========================================================

    function openLightbox(index) {

        if (!lightbox) {
            return;
        }


        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {
            return;
        }


        if (
            index < 0 ||
            index >= images.length
        ) {
            return;
        }


        currentIndex =
            index;


        const media =
            images[currentIndex];


        renderLightboxMedia(
            media
        );


        lightbox.classList.add(
            "active"
        );


        lightbox.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    // ========================================================
    // FERMETURE LIGHTBOX
    // ========================================================

    function closeLightbox() {

        if (!lightbox) {
            return;
        }


        lightbox.classList.remove(
            "active"
        );


        lightbox.setAttribute(
            "aria-hidden",
            "true"
        );


        if (lightboxMediaContainer) {

            lightboxMediaContainer.innerHTML =
                "";
        }
    }


    // ========================================================
    // MÉDIA PRÉCÉDENT
    // ========================================================

    function showPreviousImage() {

        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {
            return;
        }


        currentIndex =
            (
                currentIndex -
                1 +
                images.length
            ) %
            images.length;


        openLightbox(
            currentIndex
        );
    }


    // ========================================================
    // MÉDIA SUIVANT
    // ========================================================

    function showNextImage() {

        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {
            return;
        }


        currentIndex =
            (
                currentIndex +
                1
            ) %
            images.length;


        openLightbox(
            currentIndex
        );
    }


    // ========================================================
    // CHARGEMENT DU JSON
    // ========================================================

    try {

        const response =
            await fetch(
                "../data/images.json"
            );


        if (!response.ok) {

            throw new Error(
                `Erreur HTTP ${response.status}`
            );
        }


        images =
            await response.json();


        // ====================================================
        // MÉDIA DEMANDÉ DEPUIS LE CARROUSEL
        // ====================================================

        const urlParams =
            new URLSearchParams(
                window.location.search
            );


        const requestedMedia =
            urlParams.get(
                "media"
            );


        gallery.innerHTML =
            "";


        if (
            !Array.isArray(images) ||
            images.length === 0
        ) {

            gallery.innerHTML = `
                <p class="gallery-empty">
                    Aucun média disponible
                    pour le moment.
                </p>
            `;

            return;
        }


        // ====================================================
        // CRÉATION DE LA GALERIE
        // ====================================================

        images.forEach(
            (media, index) => {

                const item =
                    document.createElement(
                        "article"
                    );

                item.className =
                    "gallery-item";


                const type =
                    getItemType(media);


                // --------------------------------------------
                // IMAGE
                // --------------------------------------------

                if (type === "image") {

                    const imageElement =
                        document.createElement(
                            "img"
                        );

                    imageElement.src =
                        `../assets/image-apam/${media.file}`;

                    imageElement.alt =
                        media.title ||
                        "Photo de l'APAM";

                    imageElement.loading =
                        "lazy";


                    imageElement.addEventListener(
                        "click",
                        () => {
                            openLightbox(
                                index
                            );
                        }
                    );


                    item.appendChild(
                        imageElement
                    );
                }


                // --------------------------------------------
                // VIDÉO
                // --------------------------------------------

                else if (type === "video") {

                    const videoElement =
                        document.createElement(
                            "video"
                        );

                    videoElement.src =
                        `../assets/image-apam/${media.file}`;

                    videoElement.muted =
                        true;

                    videoElement.playsInline =
                        true;

                    videoElement.preload =
                        "metadata";

                    videoElement.controls =
                        false;


                    videoElement.addEventListener(
                        "click",
                        () => {
                            openLightbox(
                                index
                            );
                        }
                    );


                    item.appendChild(
                        videoElement
                    );
                }


                // --------------------------------------------
                // AUDIO
                // --------------------------------------------

                else if (type === "audio") {

                    const audioWrapper =
                        document.createElement(
                            "div"
                        );

                    audioWrapper.className =
                        "gallery-audio";


                    const titleElement =
                        document.createElement(
                            "p"
                        );

                    titleElement.textContent =
                        media.title ||
                        "Audio de l'APAM";


                    const audioElement =
                        document.createElement(
                            "audio"
                        );

                    audioElement.src =
                        `../assets/image-apam/${media.file}`;

                    audioElement.controls =
                        true;


                    audioWrapper.appendChild(
                        titleElement
                    );

                    audioWrapper.appendChild(
                        audioElement
                    );


                    item.appendChild(
                        audioWrapper
                    );
                }


                // --------------------------------------------
                // PDF
                // --------------------------------------------

                else if (type === "pdf") {

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        `../assets/image-apam/${media.file}`;

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";

                    link.textContent =
                        media.title ||
                        "Ouvrir le document PDF";


                    item.appendChild(
                        link
                    );
                }


                // --------------------------------------------
                // AUTRE FICHIER
                // --------------------------------------------

                else {

                    const link =
                        document.createElement(
                            "a"
                        );

                    link.href =
                        `../assets/image-apam/${media.file}`;

                    link.target =
                        "_blank";

                    link.rel =
                        "noopener noreferrer";

                    link.textContent =
                        media.title ||
                        "Ouvrir le fichier";


                    item.appendChild(
                        link
                    );
                }


                gallery.appendChild(
                    item
                );
            }
        );


        // ====================================================
        // OUVERTURE AUTOMATIQUE DU MÉDIA DEMANDÉ
        // ====================================================

        if (requestedMedia) {

            const requestedIndex =
                images.findIndex(
                    (media) =>
                        media.file ===
                        requestedMedia
                );


            if (requestedIndex !== -1) {

                openLightbox(
                    requestedIndex
                );
            }
        }


        // ====================================================
        // BOUTON PRÉCÉDENT
        // ====================================================

        if (prevButton) {

            prevButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    showPreviousImage();
                }
            );
        }


        // ====================================================
        // BOUTON SUIVANT
        // ====================================================

        if (nextButton) {

            nextButton.addEventListener(
                "click",
                (event) => {

                    event.stopPropagation();

                    showNextImage();
                }
            );
        }


        // ====================================================
        // FERMETURE
        // ====================================================

        if (closeButton) {

            closeButton.addEventListener(
                "click",
                () => {
                    closeLightbox();
                }
            );
        }


        if (lightbox) {

            lightbox.addEventListener(
                "click",
                (event) => {

                    if (
                        event.target ===
                        lightbox
                    ) {

                        closeLightbox();
                    }
                }
            );
        }


        // ====================================================
        // CLAVIER
        // ====================================================

        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    !lightbox ||
                    !lightbox.classList.contains(
                        "active"
                    )
                ) {
                    return;
                }


                if (
                    event.key ===
                    "Escape"
                ) {

                    closeLightbox();
                    return;
                }


                if (
                    event.key ===
                    "ArrowLeft"
                ) {

                    showPreviousImage();
                    return;
                }


                if (
                    event.key ===
                    "ArrowRight"
                ) {

                    showNextImage();
                }
            }
        );


    } catch (error) {

        console.error(
            "Impossible de charger "
            + "la galerie APAM :",
            error
        );


        gallery.innerHTML = `
            <p class="gallery-error">
                Impossible de charger
                les médias.
            </p>
        `;
    }
});