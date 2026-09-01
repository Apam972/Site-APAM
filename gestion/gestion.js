document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ============================================================
        // CONFIGURATION
        // ============================================================

        const APPS_SCRIPT_URL =
            "https://script.google.com/macros/s/AKfycby6uuWmZ2Jo5i3z3Dwvvg0XBKjrkgOJe-b9k_b10_c6jFl-MExJj2-4h4jJ61hWVE2dOw/exec";

        const ACTUALITES_JSON_URL =
            "../data/actualites.json";


        // ============================================================
        // DONNÉES
        // ============================================================

        let actualites = [];

        let editingId = null;


        // ============================================================
        // NAVIGATION DES ONGLETS
        // ============================================================

        const tabs =
            document.querySelectorAll(
                ".gestion-tab"
            );

        const tabContents =
            document.querySelectorAll(
                ".gestion-tab-content"
            );


        function activateTab(
            selectedTab
        ) {

            const target =
                selectedTab.getAttribute(
                    "data-tab"
                );


            if (!target) {
                return;
            }


            tabs.forEach(
                (tab) => {

                    tab.classList.toggle(
                        "active",
                        tab === selectedTab
                    );
                }
            );


            tabContents.forEach(
                (content) => {

                    const isTarget =
                        content.getAttribute(
                            "data-content"
                        ) === target;


                    content.classList.toggle(
                        "active",
                        isTarget
                    );
                }
            );
        }


        tabs.forEach(
            (tab) => {

                tab.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();

                        activateTab(
                            tab
                        );
                    }
                );
            }
        );


        // ============================================================
        // ÉLÉMENTS ACTUALITÉS
        // ============================================================

        const newsList =
            document.getElementById(
                "news-list"
            );

        const newsEditor =
            document.getElementById(
                "news-editor"
            );

        const newsForm =
            document.getElementById(
                "news-form"
            );

        const newNewsButton =
            document.getElementById(
                "new-news-button"
            );

        const newNewsEmptyButton =
            document.getElementById(
                "new-news-empty-button"
            );

        const cancelEditorButton =
            document.getElementById(
                "cancel-editor-button"
            );

        const cancelNewsButton =
            document.getElementById(
                "cancel-news-button"
            );

        const editorTitle =
            document.getElementById(
                "editor-title"
            );

        const newsIdInput =
            document.getElementById(
                "news-id"
            );

        const newsTitleInput =
            document.getElementById(
                "news-title"
            );

        const newsDateInput =
            document.getElementById(
                "news-date"
            );

        const newsCoverInput =
            document.getElementById(
                "news-cover"
            );

        const newsImagesInput =
            document.getElementById(
                "news-images"
            );

        const newsContentInput =
            document.getElementById(
                "news-content"
            );

        const coverFileName =
            document.getElementById(
                "cover-file-name"
            );

        const imagesFileCount =
            document.getElementById(
                "images-file-count"
            );

        const coverPreview =
            document.getElementById(
                "cover-preview"
            );

        const imagesPreview =
            document.getElementById(
                "images-preview"
            );

        const previewImage =
            document.getElementById(
                "news-preview-image"
            );

        const previewTitle =
            document.getElementById(
                "news-preview-title"
            );

        const previewDate =
            document.getElementById(
                "news-preview-date"
            );

        const previewText =
            document.getElementById(
                "news-preview-text"
            );


        if (
            !newsList ||
            !newsEditor ||
            !newsForm
        ) {

            console.error(
                "Interface Actualités introuvable."
            );

            return;
        }


        // ============================================================
        // UTILITAIRES
        // ============================================================

        function generateId() {

            return (
                Date.now().toString(36) +
                Math.random()
                    .toString(36)
                    .slice(2, 8)
            );
        }


        function formatDate(
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


        function escapeHtml(
            value
        ) {

            const div =
                document.createElement(
                    "div"
                );


            div.textContent =
                value || "";


            return div.innerHTML;
        }


        function getPreviewText(
            content
        ) {

            const text =
                (content || "")
                    .trim()
                    .replace(
                        /\s+/g,
                        " "
                    );


            if (!text) {
                return "";
            }


            const maxLength =
                160;


            return (
                text.length > maxLength
                    ? `${text.slice(
                        0,
                        maxLength
                    )}...`
                    : text
            );
        }


        // ============================================================
        // CHARGEMENT DEPUIS actualites.json
        // ============================================================

        async function loadActualitesFromServer() {

            try {

                console.log(
                    "Chargement des actualités..."
                );


                const response =
                    await fetch(
                        `${ACTUALITES_JSON_URL}?ts=${Date.now()}`,
                        {
                            cache: "no-store"
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Impossible de charger actualites.json (${response.status})`
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


                actualites =
                    data.map(
                        (news) => ({
                            ...news
                        })
                    );


                console.log(
                    `${actualites.length} actualité(s) chargée(s).`
                );


                renderNewsList();


            } catch (error) {

                console.error(
                    "Erreur de chargement :",
                    error
                );


                actualites = [];


                renderNewsList(
                    true
                );


                window.alert(
                    "Impossible de charger les actualités depuis le serveur.\n\n" +
                    error.message
                );
            }
        }


        // ============================================================
        // RENDU DE LA LISTE
        // ============================================================

        function renderNewsList(
            loadError = false
        ) {

            newsList.innerHTML =
                "";


            if (
                actualites.length === 0
            ) {

                const empty =
                    document.createElement(
                        "div"
                    );


                empty.className =
                    "news-list-empty";


                empty.innerHTML = `
                    <p>
                        ${
                            loadError
                                ? "Impossible de charger les actualités."
                                : "Aucune actualité pour le moment."
                        }
                    </p>

                    <button
                        type="button"
                        class="button-primary"
                        id="new-news-empty-button-rendered"
                    >
                        ${
                            loadError
                                ? "Réessayer"
                                : "Créer la première actualité"
                        }
                    </button>
                `;


                newsList.appendChild(
                    empty
                );


                const button =
                    document.getElementById(
                        "new-news-empty-button-rendered"
                    );


                if (button) {

                    button.addEventListener(
                        "click",
                        () => {

                            if (loadError) {

                                loadActualitesFromServer();

                            } else {

                                openEditor();
                            }
                        }
                    );
                }


                return;
            }


            const sorted =
                [...actualites].sort(
                    (a, b) => {

                        return (
                            (b.date || "")
                                .localeCompare(
                                    a.date || ""
                                )
                        );
                    }
                );


            sorted.forEach(
                (news) => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "news-card";


                    // ------------------------------------------------
                    // IMAGE
                    // ------------------------------------------------

                    const image =
                        document.createElement(
                            "div"
                        );


                    image.className =
                        "news-card-image";


                    if (
                        news.cover
                    ) {

                        const imageElement =
                            document.createElement(
                                "img"
                            );


                        imageElement.src =
                            `../${news.cover}`;


                        imageElement.alt =
                            news.title ||
                            "Actualité APAM";


                        imageElement.loading =
                            "lazy";


                        image.appendChild(
                            imageElement
                        );
                    }


                    // ------------------------------------------------
                    // INFORMATIONS
                    // ------------------------------------------------

                    const info =
                        document.createElement(
                            "div"
                        );


                    info.className =
                        "news-card-info";


                    info.innerHTML = `
                        <p class="news-card-date">
                            ${escapeHtml(
                                formatDate(
                                    news.date
                                )
                            )}
                        </p>

                        <h3>
                            ${escapeHtml(
                                news.title
                            )}
                        </h3>

                        <p class="news-card-description">
                            ${escapeHtml(
                                getPreviewText(
                                    news.content
                                )
                            )}
                        </p>
                    `;


                    // ------------------------------------------------
                    // ACTIONS
                    // ------------------------------------------------

                    const actions =
                        document.createElement(
                            "div"
                        );


                    actions.className =
                        "news-card-actions";


                    const editButton =
                        document.createElement(
                            "button"
                        );


                    editButton.type =
                        "button";


                    editButton.className =
                        "button-secondary";


                    editButton.textContent =
                        "Modifier";


                    editButton.addEventListener(
                        "click",
                        () => {

                            openEditor(
                                news.id
                            );
                        }
                    );


                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "button-primary";


                    deleteButton.textContent =
                        "Supprimer";


                    deleteButton.addEventListener(
                        "click",
                        () => {

                            deleteNews(
                                news.id
                            );
                        }
                    );


                    actions.appendChild(
                        editButton
                    );


                    actions.appendChild(
                        deleteButton
                    );


                    card.appendChild(
                        image
                    );


                    card.appendChild(
                        info
                    );


                    card.appendChild(
                        actions
                    );


                    newsList.appendChild(
                        card
                    );
                }
            );
        }


        // ============================================================
        // OUVRIR L'ÉDITEUR
        // ============================================================

        function openEditor(
            newsId = null
        ) {

            editingId =
                newsId;


            newsEditor.hidden =
                false;


            newsList.hidden =
                true;


            if (newsId) {

                const news =
                    actualites.find(
                        (item) =>
                            item.id === newsId
                    );


                if (!news) {

                    window.alert(
                        "Actualité introuvable."
                    );

                    return;
                }


                editorTitle.textContent =
                    "Modifier l'actualité";


                newsIdInput.value =
                    news.id || "";


                newsTitleInput.value =
                    news.title || "";


                newsDateInput.value =
                    news.date || "";


                newsContentInput.value =
                    news.content || "";


                coverFileName.textContent =
                    "Image actuelle";


                imagesFileCount.textContent =
                    Array.isArray(
                        news.images
                    )
                        ? `${news.images.length} photo(s)`
                        : "Aucune photo";


                if (
                    news.cover
                ) {

                    previewImage.style
                        .backgroundImage =
                        `url("../${news.cover}")`;


                    previewImage.classList.add(
                        "has-image"
                    );


                    previewImage.textContent =
                        "";

                } else {

                    previewImage.style
                        .backgroundImage =
                        "";

                    previewImage.classList.remove(
                        "has-image"
                    );

                    previewImage.textContent =
                        "Image principale";
                }


                previewTitle.textContent =
                    news.title ||
                    "Titre de l'actualité";


                previewDate.textContent =
                    formatDate(
                        news.date
                    ) ||
                    "Date de l'actualité";


                previewText.textContent =
                    getPreviewText(
                        news.content
                    ) ||
                    "Le début de ton article apparaîtra ici...";


            } else {

                editorTitle.textContent =
                    "Nouvelle actualité";


                newsIdInput.value =
                    "";


                resetForm();
            }


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }


        // ============================================================
        // FERMER L'ÉDITEUR
        // ============================================================

        function closeEditor() {

            newsEditor.hidden =
                true;


            newsList.hidden =
                false;


            editingId =
                null;


            resetForm();


            renderNewsList();
        }


        // ============================================================
        // RESET FORMULAIRE
        // ============================================================

        function resetForm() {

            newsForm.reset();


            newsIdInput.value =
                "";


            coverFileName.textContent =
                "Aucun fichier sélectionné";


            imagesFileCount.textContent =
                "Aucune photo sélectionnée";


            coverPreview.innerHTML =
                "";


            coverPreview.classList.remove(
                "active"
            );


            imagesPreview.innerHTML =
                "";


            previewImage.style
                .backgroundImage =
                "";


            previewImage.classList.remove(
                "has-image"
            );


            previewImage.textContent =
                "Image principale";


            previewTitle.textContent =
                "Titre de l'actualité";


            previewDate.textContent =
                "Date de l'actualité";


            previewText.textContent =
                "Le début de ton article apparaîtra ici...";


            const today =
                new Date();


            const year =
                today.getFullYear();


            const month =
                String(
                    today.getMonth() + 1
                ).padStart(
                    2,
                    "0"
                );


            const day =
                String(
                    today.getDate()
                ).padStart(
                    2,
                    "0"
                );


            newsDateInput.value =
                `${year}-${month}-${day}`;
        }


        // ============================================================
        // IMAGE PRINCIPALE
        // ============================================================

        newsCoverInput.addEventListener(
            "change",
            () => {

                const file =
                    newsCoverInput.files[0];


                if (!file) {
                    return;
                }


                coverFileName.textContent =
                    file.name;


                const reader =
                    new FileReader();


                reader.onload =
                    (event) => {

                        coverPreview.innerHTML =
                            "";


                        const image =
                            document.createElement(
                                "img"
                            );


                        image.src =
                            event.target.result;


                        image.alt =
                            file.name;


                        coverPreview.appendChild(
                            image
                        );


                        coverPreview.classList.add(
                            "active"
                        );


                        previewImage.style
                            .backgroundImage =
                            `url("${event.target.result}")`;


                        previewImage.classList.add(
                            "has-image"
                        );


                        previewImage.textContent =
                            "";
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );


        // ============================================================
        // PHOTOS
        // ============================================================

        newsImagesInput.addEventListener(
            "change",
            () => {

                const files =
                    Array.from(
                        newsImagesInput.files
                    );


                imagesPreview.innerHTML =
                    "";


                if (
                    files.length === 0
                ) {

                    imagesFileCount.textContent =
                        "Aucune photo sélectionnée";


                    return;
                }


                imagesFileCount.textContent =
                    `${files.length} photo(s) sélectionnée(s)`;


                files.forEach(
                    (file) => {

                        const reader =
                            new FileReader();


                        reader.onload =
                            (event) => {

                                const wrapper =
                                    document.createElement(
                                        "div"
                                    );


                                wrapper.className =
                                    "preview-thumbnail";


                                const image =
                                    document.createElement(
                                        "img"
                                    );


                                image.src =
                                    event.target.result;


                                image.alt =
                                    file.name;


                                wrapper.appendChild(
                                    image
                                );


                                imagesPreview.appendChild(
                                    wrapper
                                );
                            };


                        reader.readAsDataURL(
                            file
                        );
                    }
                );
            }
        );


        // ============================================================
        // APERÇU TITRE
        // ============================================================

        newsTitleInput.addEventListener(
            "input",
            () => {

                previewTitle.textContent =
                    newsTitleInput.value.trim()
                    ||
                    "Titre de l'actualité";
            }
        );


        // ============================================================
        // APERÇU DATE
        // ============================================================

        newsDateInput.addEventListener(
            "change",
            () => {

                previewDate.textContent =
                    formatDate(
                        newsDateInput.value
                    )
                    ||
                    "Date de l'actualité";
            }
        );


        // ============================================================
        // APERÇU ARTICLE
        // ============================================================

        newsContentInput.addEventListener(
            "input",
            () => {

                previewText.textContent =
                    getPreviewText(
                        newsContentInput.value
                    )
                    ||
                    "Le début de ton article apparaîtra ici...";
            }
        );


        // ============================================================
        // NOUVELLE ACTUALITÉ
        // ============================================================

        if (newNewsButton) {

            newNewsButton.addEventListener(
                "click",
                () => {

                    openEditor();
                }
            );
        }


        if (newNewsEmptyButton) {

            newNewsEmptyButton.addEventListener(
                "click",
                () => {

                    openEditor();
                }
            );
        }


        // ============================================================
        // RETOUR
        // ============================================================

        if (cancelEditorButton) {

            cancelEditorButton.addEventListener(
                "click",
                () => {

                    closeEditor();
                }
            );
        }


        if (cancelNewsButton) {

            cancelNewsButton.addEventListener(
                "click",
                () => {

                    const confirmed =
                        window.confirm(
                            "Abandonner les modifications ?"
                        );


                    if (confirmed) {

                        closeEditor();
                    }
                }
            );
        }


        // ============================================================
        // ENREGISTREMENT → GOOGLE DRIVE
        // ============================================================

        newsForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                const title =
                    newsTitleInput.value.trim();


                const date =
                    newsDateInput.value;


                const content =
                    newsContentInput.value.trim();


                const coverFile =
                    newsCoverInput.files[0];


                const imageFiles =
                    Array.from(
                        newsImagesInput.files
                    );


                if (
                    !title ||
                    !date ||
                    !content
                ) {

                    window.alert(
                        "Merci de remplir le titre, la date et l'article."
                    );

                    return;
                }


                if (
                    !coverFile &&
                    !editingId
                ) {

                    window.alert(
                        "Merci de sélectionner une image principale."
                    );

                    return;
                }


                const submitButton =
                    newsForm.querySelector(
                        'button[type="submit"]'
                    );


                try {

                    if (submitButton) {

                        submitButton.disabled =
                            true;

                        submitButton.textContent =
                            "Enregistrement...";
                    }


                    let coverData =
                        null;


                    let coverName =
                        "";


                    if (coverFile) {

                        coverName =
                            coverFile.name;


                        coverData =
                            await fileToDataURL(
                                coverFile
                            );
                    }


                    const imagesData =
                        [];


                    for (
                        const file of imageFiles
                    ) {

                        const dataUrl =
                            await fileToDataURL(
                                file
                            );


                        imagesData.push(
                            dataUrl
                        );
                    }


                    const payload = {

                        title,

                        date,

                        content,

                        cover:
                            coverData,

                        images:
                            imagesData
                    };


                    console.log(
                        "Envoi vers Apps Script..."
                    );


                    const response =
                        await fetch(
                            APPS_SCRIPT_URL,
                            {
                                method: "POST",

                                headers: {
                                    "Content-Type":
                                        "text/plain;charset=utf-8"
                                },

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );


                    const responseText =
                        await response.text();


                    console.log(
                        "Réponse Apps Script :",
                        responseText
                    );


                    let result;


                    try {

                        result =
                            JSON.parse(
                                responseText
                            );

                    } catch (parseError) {

                        throw new Error(
                            "Réponse invalide du serveur Apps Script."
                        );
                    }


                    if (
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Le serveur a refusé l'actualité."
                        );
                    }


                    // ------------------------------------------------
                    // ACTUALISATION IMMÉDIATE DE LA LISTE
                    // ------------------------------------------------
                    // L'actualité vient d'être écrite dans Drive.
                    // Le JSON public sera mis à jour au prochain sync.

                    const temporaryNews = {

                        id:
                            result.folder ||
                            generateId(),

                        slug:
                            result.folder ||
                            generateId(),

                        title,

                        date,

                        content,

                        cover:
                            "",

                        images:
                            [],

                        coverData:
                            coverData,

                        coverName:
                            coverName,

                        imageNames:
                            imageFiles.map(
                                (file) =>
                                    file.name
                            )
                    };


                    if (editingId) {

                        const newsIndex =
                            actualites.findIndex(
                                (item) =>
                                    item.id ===
                                    editingId
                            );


                        if (
                            newsIndex !== -1
                        ) {

                            actualites[
                                newsIndex
                            ] = {

                                ...actualites[
                                    newsIndex
                                ],

                                title,

                                date,

                                content,

                                coverData:
                                    coverData ||
                                    actualites[
                                        newsIndex
                                    ].coverData ||
                                    null,

                                coverName:
                                    coverName ||
                                    actualites[
                                        newsIndex
                                    ].coverName ||
                                    "",

                                imageNames:
                                    imageFiles.map(
                                        (file) =>
                                            file.name
                                    )
                            };
                        }

                    } else {

                        actualites.push(
                            temporaryNews
                        );
                    }


                    renderNewsList();


                    window.alert(
                        "✅ Actualité enregistrée dans Google Drive.\n\n" +
                        "Elle sera disponible sur les autres appareils après la prochaine synchronisation du site."
                    );


                    closeEditor();


                } catch (error) {

                    console.error(
                        "Erreur de publication :",
                        error
                    );


                    window.alert(
                        "❌ Impossible d'enregistrer l'actualité.\n\n" +
                        error.message
                    );


                } finally {

                    if (submitButton) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Enregistrer";
                    }
                }
            }
        );


        // ============================================================
        // SUPPRESSION
        // ============================================================

        function deleteNews(
            newsId
        ) {

            const news =
                actualites.find(
                    (item) =>
                        item.id === newsId
                );


            if (!news) {
                return;
            }


            const confirmed =
                window.confirm(
                    `Supprimer l'actualité "${news.title}" ?`
                );


            if (!confirmed) {
                return;
            }


            /*
             * ATTENTION :
             * Pour l'instant, cette suppression ne supprime
             * PAS encore le dossier Google Drive.
             *
             * On branchera l'endpoint Apps Script de suppression
             * dans la prochaine étape.
             */


            actualites =
                actualites.filter(
                    (item) =>
                        item.id !== newsId
                );


            renderNewsList();
        }


        // ============================================================
        // FILE → DATA URL
        // ============================================================

        function fileToDataURL(
            file
        ) {

            return new Promise(
                (
                    resolve,
                    reject
                ) => {

                    const reader =
                        new FileReader();


                    reader.onload =
                        () => {

                            resolve(
                                reader.result
                            );
                        };


                    reader.onerror =
                        () => {

                            reject(
                                new Error(
                                    "Impossible de lire "
                                    + file.name
                                )
                            );
                        };


                    reader.readAsDataURL(
                        file
                    );
                }
            );
        }

        // ============================================================
        // ÉLÉMENTS MÉDIAS — APAM EN ACTION
        // ============================================================

        const mediaGallery =
            document.getElementById(
                "media-gallery"
            );

        const mediaGalleryEmpty =
            document.getElementById(
                "media-gallery-empty"
            );

        const mediaEditor =
            document.getElementById(
                "media-editor"
            );

        const mediaForm =
            document.getElementById(
                "media-form"
            );

        const newMediaButton =
            document.getElementById(
                "new-media-button"
            );

        const mediaEmptyAddButton =
            document.getElementById(
                "media-empty-add-button"
            );

        const cancelMediaEditorButton =
            document.getElementById(
                "cancel-media-editor-button"
            );

        const cancelMediaButton =
            document.getElementById(
                "cancel-media-button"
            );

        const mediaEditorTitle =
            document.getElementById(
                "media-editor-title"
            );

        const mediaDriveIdInput =
            document.getElementById(
                "media-drive-id"
            );

        const mediaTitleInput =
            document.getElementById(
                "media-title"
            );

        const mediaDateInput =
            document.getElementById(
                "media-date"
            );

        const mediaDescriptionInput =
            document.getElementById(
                "media-description"
            );
            const mediaFileInput =
             document.getElementById(
                 "media-file"
            );


        // ============================================================
        // DONNÉES MÉDIAS
        // ============================================================

        const MEDIA_JSON_URL =
            "../data/images.json";

        let medias = [];

        let editingMediaId = null;

        async function callMediaApi(
    payload
) {

    const response =
        await fetch(
            APPS_SCRIPT_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(
                        payload
                    )
            }
        );


    const responseText =
        await response.text();


    let result;

    try {

        result =
            JSON.parse(
                responseText
            );

    } catch (error) {

        throw new Error(
            "Réponse invalide du serveur Apps Script."
        );
    }


    if (
        !result.success
    ) {

        throw new Error(
            result.message ||
            "Le serveur a refusé l'opération."
        );
    }


    return result;
}


        // ============================================================
        // UTILITAIRES MÉDIAS
        // ============================================================

        function getMediaUrl(
            media
        ) {

            if (
                !media ||
                !media.file
            ) {

                return "";
            }

            return (
                `../assets/image-apam/${encodeURIComponent(
                    media.file
                )}`
            );
        }


        function getMediaTypeLabel(
            type
        ) {

            switch (
                String(type || "").toLowerCase()
            ) {

                case "video":
                    return "Vidéo";

                case "image":
                    return "Photo";

                case "audio":
                    return "Audio";

                case "pdf":
                    return "PDF";

                default:
                    return "Fichier";
            }
        }


        function escapeAttribute(
            value
        ) {

            return escapeHtml(
                value || ""
            )
            .replace(
                /"/g,
                "&quot;"
            );
        }


        // ============================================================
        // CHARGEMENT images.json
        // ============================================================

        async function loadMediasFromServer() {

            if (!mediaGallery) {

                console.warn(
                    "Interface Médias introuvable."
                );

                return;
            }


            try {

                console.log(
                    "Chargement des médias..."
                );


                const response =
                    await fetch(
                        `${MEDIA_JSON_URL}?ts=${Date.now()}`,
                        {
                            cache:
                                "no-store"
                        }
                    );


                if (!response.ok) {

                    throw new Error(
                        `Impossible de charger images.json (${response.status})`
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


                medias =
                    data.map(
                        (
                            media,
                            index
                        ) => ({

                            ...media,

                            _index:
                                index,

                            _id:
                                media.drive_id ||
                                media.file ||
                                `media-${index}`
                        })
                    );


                console.log(
                    `${medias.length} média(s) chargé(s).`
                );


                renderMediaGallery();


            } catch (error) {

                console.error(
                    "Erreur de chargement des médias :",
                    error
                );


                medias = [];


                renderMediaGallery(
                    true
                );
            }
        }


        // ============================================================
        // RENDU GALERIE
        // ============================================================

        function renderMediaGallery(
            loadError = false
        ) {

            if (!mediaGallery) {

                return;
            }


            /*
             * On conserve le bloc "aucun média" présent
             * dans le HTML et on ne détruit pas son contenu.
             */

            const existingCards =
                mediaGallery.querySelectorAll(
                    ".media-card"
                );


            existingCards.forEach(
                (
                    card
                ) => {

                    card.remove();
                }
            );


            if (
                medias.length === 0
            ) {

                if (
                    mediaGalleryEmpty
                ) {

                    mediaGalleryEmpty.hidden =
                        false;


                    const title =
                        mediaGalleryEmpty.querySelector(
                            "h3"
                        );


                    const text =
                        mediaGalleryEmpty.querySelector(
                            "p"
                        );


                    if (title) {

                        title.textContent =
                            loadError
                                ? "Impossible de charger les médias"
                                : "Aucun média";
                    }


                    if (text) {

                        text.textContent =
                            loadError
                                ? "Une erreur est survenue pendant le chargement de images.json."
                                : "Aucun média n'est disponible pour le moment.";
                    }
                }


                return;
            }


            if (
                mediaGalleryEmpty
            ) {

                mediaGalleryEmpty.hidden =
                    true;
            }


            medias.forEach(
                (
                    media
                ) => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "media-card";


                    // ------------------------------------------------
                    // APERÇU
                    // ------------------------------------------------

                    const preview =
                        document.createElement(
                            "div"
                        );


                    preview.className =
                        "media-card-preview";


                    const type =
                        String(
                            media.type || ""
                        ).toLowerCase();


                    const mediaUrl =
                        getMediaUrl(
                            media
                        );


                    if (
                        type === "video"
                    ) {

                        const video =
                            document.createElement(
                                "video"
                            );


                        video.src =
                            mediaUrl;


                        video.muted =
                            true;


                        video.playsInline =
                            true;


                        video.preload =
                            "metadata";


                        video.setAttribute(
                            "aria-label",
                            media.title ||
                            "Vidéo APAM"
                        );


                        preview.appendChild(
                            video
                        );


                    } else if (
                        type === "image"
                    ) {

                        const image =
                            document.createElement(
                                "img"
                            );


                        image.src =
                            mediaUrl;


                        image.alt =
                            media.title ||
                            "Média APAM";


                        image.loading =
                            "lazy";


                        image.addEventListener(
                            "error",
                            () => {

                                preview.innerHTML =
                                    `
                                    <div
                                        class="media-card-preview-empty"
                                    >
                                        Média introuvable
                                    </div>
                                    `;
                            }
                        );


                        preview.appendChild(
                            image
                        );


                    } else {

                        preview.innerHTML =
                            `
                            <div
                                class="media-card-preview-empty"
                            >
                                ${escapeHtml(
                                    getMediaTypeLabel(
                                        media.type
                                    )
                                )}
                            </div>
                            `;
                    }


                    // ------------------------------------------------
                    // BADGE
                    // ------------------------------------------------

                    const badge =
                        document.createElement(
                            "span"
                        );


                    badge.className =
                        "media-type-badge";


                    badge.textContent =
                        getMediaTypeLabel(
                            media.type
                        );


                    preview.appendChild(
                        badge
                    );


                    // ------------------------------------------------
                    // INFORMATIONS
                    // ------------------------------------------------

                    const info =
                        document.createElement(
                            "div"
                        );


                    info.className =
                        "media-card-info";


                    info.innerHTML =
                        `
                        <h3
                            class="media-card-title"
                        >
                            ${escapeHtml(
                                media.title ||
                                "Sans titre"
                            )}
                        </h3>

                        <p
                            class="media-card-date"
                        >
                            ${escapeHtml(
                                formatDate(
                                    media.date
                                ) ||
                                "Date inconnue"
                            )}
                        </p>

                        ${
                            media.description
                                ? `
                                    <p
                                        class="media-card-description"
                                    >
                                        ${escapeHtml(
                                            media.description
                                        )}
                                    </p>
                                  `
                                : ""
                        }
                        `;


                    // ------------------------------------------------
                    // ACTIONS
                    // ------------------------------------------------

                    const actions =
                        document.createElement(
                            "div"
                        );


                    actions.className =
                        "media-card-actions";


                    // MODIFIER

                    const editButton =
                        document.createElement(
                            "button"
                        );


                    editButton.type =
                        "button";


                    editButton.className =
                        "button-secondary";


                    editButton.textContent =
                        "Modifier";


                    editButton.addEventListener(
                        "click",
                        () => {

                            openMediaEditor(
                                media._id
                            );
                        }
                    );


                    // SUPPRIMER

                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "button-primary";


                    deleteButton.textContent =
                        "Supprimer";


                    deleteButton.addEventListener(
                        "click",
                        () => {

                            requestMediaDeletion(
                                media
                            );
                        }
                    );


                    actions.appendChild(
                        editButton
                    );


                    actions.appendChild(
                        deleteButton
                    );


                    // ------------------------------------------------
                    // ASSEMBLAGE
                    // ------------------------------------------------

                    card.appendChild(
                        preview
                    );


                    card.appendChild(
                        info
                    );


                    card.appendChild(
                        actions
                    );


                    mediaGallery.appendChild(
                        card
                    );
                }
            );
        }


        // ============================================================
        // OUVERTURE ÉDITEUR MÉDIA
        // ============================================================

        function openMediaEditor(
            mediaId
        ) {

            const media =
                medias.find(
                    (
                        item
                    ) =>
                        item._id === mediaId
                );


            if (!media) {

                window.alert(
                    "Média introuvable."
                );

                return;
            }


            editingMediaId =
                mediaId;
if (
    mediaFileInput
) {

    mediaFileInput.value =
        "";
}

            if (
                mediaEditor
            ) {

                mediaEditor.hidden =
                    false;
            }


            if (
                mediaTitleInput
            ) {

                mediaTitleInput.value =
                    media.title ||
                    "";
            }


            if (
                mediaDateInput
            ) {

                mediaDateInput.value =
                    media.date ||
                    "";
            }


            if (
                mediaDescriptionInput
            ) {

                mediaDescriptionInput.value =
                    media.description ||
                    "";
            }


            if (
                mediaDriveIdInput
            ) {

                mediaDriveIdInput.value =
                    media.drive_id ||
                    "";
            }


            if (
                mediaEditorTitle
            ) {

                mediaEditorTitle.textContent =
                    "Modifier le média";
            }


            if (
                mediaGallery
            ) {

                mediaGallery.hidden =
                    true;
            }


            if (mediaEditor) {
    mediaEditor.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
   }
 }


        // ============================================================
        // FERMETURE ÉDITEUR MÉDIA
        // ============================================================

        function closeMediaEditor() {

            if (
                mediaEditor
            ) {

                mediaEditor.hidden =
                    true;
            }


            if (
                mediaGallery
            ) {

                mediaGallery.hidden =
                    false;
            }


            editingMediaId =
                null;


            if (
                mediaForm
            ) {

                mediaForm.reset();
            }
        }


        // ============================================================
        // DEMANDE DE SUPPRESSION
        // ============================================================

       async function requestMediaDeletion(
    media
) {

    if (!media) {

        return;
    }


    if (!media.drive_id) {

        window.alert(
            "Impossible de supprimer ce média : drive_id manquant."
        );

        return;
    }


    const confirmed =
        window.confirm(
            `Supprimer le média "${media.title || media.file}" ?\n\n` +
            "Le fichier sera placé dans la corbeille Google Drive."
        );


    if (!confirmed) {

        return;
    }


    try {

        const result =
            await callMediaApi(
                {
                    action:
                        "delete_media",

                    drive_id:
                        media.drive_id
                }
            );


        // Retrait immédiat de l'interface

        medias =
            medias.filter(
                (
                    item
                ) =>
                    item._id !==
                    media._id
            );


        renderMediaGallery();


        window.alert(
            `✅ ${result.message || "Média supprimé."}\n\n` +
            "Le catalogue du site sera mis à jour lors de la prochaine synchronisation."
        );


    } catch (error) {

        console.error(
            "Erreur de suppression média :",
            error
        );


        window.alert(
            "❌ Impossible de supprimer le média.\n\n" +
            error.message
        );
    }
}


        // ============================================================
        // BOUTON AJOUTER UN MÉDIA
        // ============================================================

        function openNewMedia() {

            /*
             * Pour le moment, on prépare simplement
             * l'éditeur.
             *
             * Le vrai upload devra passer par Drive
             * puis déclencher le workflow de synchronisation.
             */

            editingMediaId =
                null;


            if (
                mediaEditor
            ) {

                mediaEditor.hidden =
                    false;
            }


            if (
                mediaGallery
            ) {

                mediaGallery.hidden =
                    true;
            }


            if (
                mediaEditorTitle
            ) {

                mediaEditorTitle.textContent =
                    "Ajouter un média";
            }


            if (
                mediaForm
            ) {

                mediaForm.reset();
            }


            if (
                mediaDriveIdInput
            ) {

                mediaDriveIdInput.value =
                    "";
            }
            if (mediaEditor) {
    mediaEditor.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}
        }


        // ============================================================
        // ÉVÉNEMENTS MÉDIAS
        // ============================================================

        if (
            newMediaButton
        ) {

            newMediaButton.addEventListener(
                "click",
                () => {

                    openNewMedia();
                }
            );
        }


        if (
            mediaEmptyAddButton
        ) {

            mediaEmptyAddButton.addEventListener(
                "click",
                () => {

                    openNewMedia();
                }
            );
        }


        if (
            cancelMediaEditorButton
        ) {

            cancelMediaEditorButton.addEventListener(
                "click",
                () => {

                    closeMediaEditor();
                }
            );
        }


        if (
            cancelMediaButton
        ) {

            cancelMediaButton.addEventListener(
                "click",
                () => {

                    closeMediaEditor();
                }
            );
        }


        // ============================================================
        // ENREGISTREMENT MÉDIA
        // ============================================================

       if (
    mediaForm
) {

    mediaForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const title =
                mediaTitleInput.value.trim();


            const date =
                mediaDateInput.value;


            const description =
                mediaDescriptionInput.value.trim();


            const file =
                mediaFileInput
                    ? mediaFileInput.files[0]
                    : null;


            // ========================================================
            // MODIFICATION
            // ========================================================

            if (
                editingMediaId
            ) {

                const media =
                    medias.find(
                        (
                            item
                        ) =>
                            item._id ===
                            editingMediaId
                    );


                if (!media) {

                    window.alert(
                        "Média introuvable."
                    );

                    return;
                }


                const submitButton =
                    mediaForm.querySelector(
                        'button[type="submit"]'
                    );


                try {

                    if (
                        submitButton
                    ) {

                        submitButton.disabled =
                            true;

                        submitButton.textContent =
                            "Enregistrement...";
                    }


                    await callMediaApi(
                        {
                            action:
                                "update_media",

                            drive_id:
                                media.drive_id,

                            title,

                            date,

                            description
                        }
                    );


                    // Mise à jour immédiate de l'interface

                    media.title =
                        title;

                    media.date =
                        date;

                    media.description =
                        description;


                    renderMediaGallery();


                    closeMediaEditor();


                    window.alert(
                        "✅ Média modifié.\n\n" +
                        "La modification sera prise en compte dans le catalogue après la prochaine synchronisation."
                    );


                } catch (error) {

                    console.error(
                        "Erreur de modification média :",
                        error
                    );


                    window.alert(
                        "❌ Impossible de modifier le média.\n\n" +
                        error.message
                    );


                } finally {

                    if (
                        submitButton
                    ) {

                        submitButton.disabled =
                            false;

                        submitButton.textContent =
                            "Enregistrer";
                    }
                }


                return;
            }


            // ========================================================
            // AJOUT
            // ========================================================

            if (!file) {

                window.alert(
                    "Merci de sélectionner une photo ou une vidéo."
                );

                return;
            }


            if (!title) {

                window.alert(
                    "Merci de renseigner un titre."
                );

                return;
            }


            const submitButton =
                mediaForm.querySelector(
                    'button[type="submit"]'
                );


            try {

                if (
                    submitButton
                ) {

                    submitButton.disabled =
                        true;

                    submitButton.textContent =
                        "Envoi...";
                }


                const fileData =
                    await fileToDataURL(
                        file
                    );


                const result =
                    await callMediaApi(
                        {
                            action:
                                "create_media",

                            fileName:
                                file.name,

                            mimeType:
                                file.type,

                            fileData,

                            title,

                            date,

                            description
                        }
                    );


                closeMediaEditor();


                window.alert(
                    "✅ Média envoyé vers Google Drive.\n\n" +
                    "Le fichier apparaîtra dans la galerie du site après la prochaine synchronisation."
                );


                console.log(
                    "Média créé :",
                    result
                );


            } catch (error) {

                console.error(
                    "Erreur d'ajout média :",
                    error
                );


                window.alert(
                    "❌ Impossible d'ajouter le média.\n\n" +
                    error.message
                );


            } finally {

                if (
                    submitButton
                ) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "Enregistrer";
                }
            }

        }
    );
}
        // ============================================================
        // GESTION DES CHAMPS — VOLONTARIAT
        // ============================================================

        const fieldModal =
            document.getElementById(
                "field-modal"
            );

        const fieldModalOverlay =
            document.getElementById(
                "field-modal-overlay"
            );

        const fieldModalClose =
            document.getElementById(
                "field-modal-close"
            );

        const fieldModalCancel =
            document.getElementById(
                "field-modal-cancel"
            );

        const fieldForm =
            document.getElementById(
                "field-form"
            );

        const fieldModalTitle =
            document.getElementById(
                "field-modal-title"
            );

        const fieldIdInput =
            document.getElementById(
                "field-id"
            );

        const fieldLabelInput =
            document.getElementById(
                "field-label"
            );

        const fieldTypeInput =
            document.getElementById(
                "field-type"
            );

            const fieldMaxLengthGroup =
    document.getElementById(
        "field-max-length-group"
    );

const fieldMaxLengthInput =
    document.getElementById(
        "field-max-length"
    );

        const fieldDescriptionInput =
            document.getElementById(
                "field-description"
            );

        const fieldRequiredInput =
            document.getElementById(
                "field-required"
            );

        const fieldOptionsGroup =
            document.getElementById(
                "field-options-group"
            );

        const fieldOptionsInput =
            document.getElementById(
                "field-options"
            );

        const volunteerFieldsList =
            document.getElementById(
                "volunteer-fields-list"
            );

        const volunteerFieldsEmpty =
            document.getElementById(
                "volunteer-fields-empty"
            );

        const addVolunteerFieldButton =
            document.getElementById(
                "add-volunteer-field-button"
            );

        const addVolunteerFieldEmptyButton =
            document.getElementById(
                "add-volunteer-field-empty-button"
            );


        // ============================================================
        // DONNÉES TEMPORAIRES
        // ============================================================

        let volunteerFields = [];

        let editingFieldId = null;


        // ============================================================
        // LIBELLÉS DES TYPES
        // ============================================================

        function getFieldTypeLabel(
            type
        ) {

            switch (type) {

                case "text":
                    return "Texte court";

                case "textarea":
                    return "Texte long";

                case "email":
                    return "Adresse e-mail";

                case "tel":
                    return "Téléphone";

                case "date":
                    return "Date";

                case "file":
                    return "Fichier";

                case "select":
                    return "Liste déroulante";

                case "checkbox":
                    return "Case à cocher";

                default:
                    return "Champ";
            }
        }


        // ============================================================
        // AFFICHAGE DES CHAMPS
        // ============================================================

        function renderVolunteerFields() {

            if (
                !volunteerFieldsList ||
                !volunteerFieldsEmpty
            ) {

                return;
            }


            volunteerFieldsList.innerHTML =
                "";


            if (
                volunteerFields.length === 0
            ) {

                volunteerFieldsEmpty.hidden =
                    false;

                return;
            }


            volunteerFieldsEmpty.hidden =
                true;


            volunteerFields.forEach(
                (
                    field
                ) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "field-management-item";


                    const information =
                        document.createElement(
                            "div"
                        );


                    information.className =
                        "field-management-info";


                    information.innerHTML = `

                        <div class="field-management-main">

                            <h3>
                                ${escapeHtml(
                                    field.label
                                )}
                            </h3>

                            <span class="field-type">
                                ${escapeHtml(
                                    getFieldTypeLabel(
                                        field.type
                                    )
                                )}
                            </span>

                        </div>


                        <p class="field-management-description">

                            ${
                                field.description
                                    ? escapeHtml(
                                        field.description
                                    )
                                    : "Aucune description"
                            }

                        </p>


                        <span
                            class="field-required-badge ${
                                field.required
                                    ? "required"
                                    : "optional"
                            }"
                        >

                            ${
                                field.required
                                    ? "Obligatoire"
                                    : "Facultatif"
                            }

                        </span>
                    `;


                    const actions =
                        document.createElement(
                            "div"
                        );


                    actions.className =
                        "field-management-actions";


                    // ------------------------------------------------
                    // MODIFIER
                    // ------------------------------------------------

                    const editButton =
                        document.createElement(
                            "button"
                        );


                    editButton.type =
                        "button";


                    editButton.className =
                        "button-secondary";


                    editButton.textContent =
                        "Modifier";


                    editButton.addEventListener(
                        "click",
                        () => {

                            openFieldEditor(
                                field.id
                            );
                        }
                    );


                    // ------------------------------------------------
                    // SUPPRIMER
                    // ------------------------------------------------

                    const deleteButton =
                        document.createElement(
                            "button"
                        );


                    deleteButton.type =
                        "button";


                    deleteButton.className =
                        "button-primary";


                    deleteButton.textContent =
                        "Supprimer";


                    deleteButton.addEventListener(
                        "click",
                        () => {

                            deleteVolunteerField(
                                field.id
                            );
                        }
                    );


                    actions.appendChild(
                        editButton
                    );


                    actions.appendChild(
                        deleteButton
                    );


                    item.appendChild(
                        information
                    );


                    item.appendChild(
                        actions
                    );


                    volunteerFieldsList.appendChild(
                        item
                    );
                }
            );
        }


        // ============================================================
        // OUVRIR LA MODALE
        // ============================================================

        function openFieldModal(
            field = null
        ) {

            if (!fieldModal) {
                return;
            }


            editingFieldId =
                field
                    ? field.id
                    : null;


            if (field) {

                fieldModalTitle.textContent =
                    "Modifier le champ";


                fieldIdInput.value =
                    field.id || "";


                fieldLabelInput.value =
                    field.label || "";


                fieldTypeInput.value =
                    field.type || "text";


                fieldDescriptionInput.value =
                    field.description || "";


                fieldRequiredInput.checked =
                    Boolean(
                        field.required
                    );


                fieldMaxLengthInput.value =
                    field.maxLength || 100;    

                fieldOptionsInput.value =
                    Array.isArray(
                        field.options
                    )
                        ? field.options.join(
                            "\n"
                        )
                        : "";

            } else {

                fieldModalTitle.textContent =
                    "Ajouter un champ";


                fieldForm.reset();


                fieldIdInput.value =
                    "";


                fieldTypeInput.value =
                    "text";

            }


            updateFieldOptionsVisibility();


            fieldModal.hidden =
                false;


            fieldModal.setAttribute(
                "aria-hidden",
                "false"
            );


            fieldLabelInput.focus();
        }


        // ============================================================
        // FERMER LA MODALE
        // ============================================================

        function closeFieldModal() {

            if (!fieldModal) {
                return;
            }


            fieldModal.hidden =
                true;


            fieldModal.setAttribute(
                "aria-hidden",
                "true"
            );


            editingFieldId =
                null;


            if (fieldForm) {

                fieldForm.reset();
            }


            updateFieldOptionsVisibility();
        }


        // ============================================================
        // AFFICHAGE OPTIONS LISTE
        // ============================================================

        function updateFieldOptionsVisibility() {

    if (!fieldTypeInput) {
        return;
    }

    const type =
        fieldTypeInput.value;

    const needsOptions =
        type === "select" ||
        type === "checkbox";

    if (fieldOptionsGroup) {
        fieldOptionsGroup.hidden =
            !needsOptions;
    }

    const needsMaxLength =
        type === "text";

    if (fieldMaxLengthGroup) {
        fieldMaxLengthGroup.hidden =
            !needsMaxLength;
    }
}


        // ============================================================
        // AJOUT / MODIFICATION
        // ============================================================

        if (fieldForm) {

            fieldForm.addEventListener(
                "submit",
                (event) => {

                    event.preventDefault();


                    const label =
                        fieldLabelInput.value.trim();


                    const type =
                        fieldTypeInput.value;


                    const description =
                        fieldDescriptionInput.value.trim();


                    const required =
                        fieldRequiredInput.checked;

                    const maxLength =
                        type === "text"
                        ? Number(
                        fieldMaxLengthInput.value
                                )
                        : null;
        if (
    type === "text" &&
    (
        !Number.isInteger(maxLength) ||
        maxLength < 1
    )
) {

    window.alert(
        "Merci de renseigner une longueur maximale valide."
    );

    fieldMaxLengthInput.focus();

    return;
}


                    const options =
                        fieldOptionsInput.value
                            .split("\n")
                            .map(
                                (
                                    option
                                ) =>
                                    option.trim()
                            )
                            .filter(
                                Boolean
                            );


                    if (!label) {

                        window.alert(
                            "Merci de renseigner le nom du champ."
                        );

                        fieldLabelInput.focus();

                        return;
                    }


                    if (
                        type === "select" &&
                        options.length === 0
                    ) {

                        window.alert(
                            "Merci d'ajouter au moins une option pour la liste déroulante."
                        );

                        fieldOptionsInput.focus();

                        return;
                    }


                    // ------------------------------------------------
                    // MODIFICATION
                    // ------------------------------------------------

                    if (editingFieldId) {

                        const field =
                            volunteerFields.find(
                                (
                                    item
                                ) =>
                                    item.id ===
                                    editingFieldId
                            );


                        if (!field) {

                            window.alert(
                                "Champ introuvable."
                            );

                            return;
                        }


                        field.label =
                            label;


                        field.type =
                            type;


                        field.description =
                            description;


                        field.required =
                            required;

                        field.maxLength =
                            type === "text"
                                ? maxLength
                                : null;


                        field.options =
                            type === "select"
                                ? options
                                : [];


                    } else {

                        // ------------------------------------------------
                        // CRÉATION
                        // ------------------------------------------------

                        volunteerFields.push(
                            {
                                id:
                                    generateId(),

                                label,

                                type,

                                description,

                                required,

                                maxLength:
                                type === "text"
                                    ? maxLength
                                    : null,

                                options:
                                    type === "select"
                                        ? options
                                        : []
                            }
                        );
                    }


                    renderVolunteerFields();

                    closeFieldModal();
                }
            );
        }


        // ============================================================
        // OUVRIR EN MODIFICATION
        // ============================================================

        function openFieldEditor(
            fieldId
        ) {

            const field =
                volunteerFields.find(
                    (
                        item
                    ) =>
                        item.id === fieldId
                );


            if (!field) {

                window.alert(
                    "Champ introuvable."
                );

                return;
            }


            openFieldModal(
                field
            );
        }


        // ============================================================
        // SUPPRESSION
        // ============================================================

        function deleteVolunteerField(
            fieldId
        ) {

            const field =
                volunteerFields.find(
                    (
                        item
                    ) =>
                        item.id === fieldId
                );


            if (!field) {
                return;
            }


            const confirmed =
                window.confirm(
                    `Supprimer le champ "${field.label}" ?`
                );


            if (!confirmed) {
                return;
            }


            volunteerFields =
                volunteerFields.filter(
                    (
                        item
                    ) =>
                        item.id !== fieldId
                );


            renderVolunteerFields();
        }


        // ============================================================
        // BOUTONS AJOUTER
        // ============================================================

        if (
            addVolunteerFieldButton
        ) {

            addVolunteerFieldButton.addEventListener(
                "click",
                () => {

                    openFieldModal();
                }
            );
        }


        if (
            addVolunteerFieldEmptyButton
        ) {

            addVolunteerFieldEmptyButton.addEventListener(
                "click",
                () => {

                    openFieldModal();
                }
            );
        }


        // ============================================================
        // FERMETURE MODALE
        // ============================================================

        if (fieldModalClose) {

            fieldModalClose.addEventListener(
                "click",
                () => {

                    closeFieldModal();
                }
            );
        }


        if (fieldModalCancel) {

            fieldModalCancel.addEventListener(
                "click",
                () => {

                    closeFieldModal();
                }
            );
        }


        if (fieldModalOverlay) {

            fieldModalOverlay.addEventListener(
                "click",
                () => {

                    closeFieldModal();
                }
            );
        }


        // ============================================================
        // CHANGEMENT DU TYPE
        // ============================================================

        if (fieldTypeInput) {

            fieldTypeInput.addEventListener(
                "change",
                () => {

                    updateFieldOptionsVisibility();
                }
            );
        }


        // ============================================================
        // INITIALISATION DES CHAMPS
        // ============================================================

        renderVolunteerFields();
        // ============================================================
        // INITIALISATION
        // ============================================================

        const defaultTab =
            document.querySelector(
                ".gestion-tab.active"
            );


        if (defaultTab) {

            activateTab(
                defaultTab
            );
        }


        // ------------------------------------------------------------
// CHARGEMENT DES ACTUALITÉS
// ------------------------------------------------------------

loadActualitesFromServer();


// ------------------------------------------------------------
// CHARGEMENT DES MÉDIAS
// ------------------------------------------------------------

loadMediasFromServer();



    }

);