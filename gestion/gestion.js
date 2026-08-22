document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ====================================================
        // STOCKAGE
        // ====================================================

        const STORAGE_KEY =
            "apam_actualites";


        let actualites =
            loadActualites();


        let editingId = null;


        // ====================================================
        // NAVIGATION DES ONGlets
        // ====================================================

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


        // ====================================================
        // ÉLÉMENTS ACTUALITÉS
        // ====================================================

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


        // ====================================================
        // UTILITAIRES
        // ====================================================

        function generateId() {

            return (
                Date.now().toString(36)
                +
                Math.random()
                    .toString(36)
                    .slice(2, 8)
            );
        }


        function loadActualites() {

            try {

                const raw =
                    localStorage.getItem(
                        STORAGE_KEY
                    );


                if (!raw) {
                    return [];
                }


                const data =
                    JSON.parse(
                        raw
                    );


                if (
                    !Array.isArray(data)
                ) {

                    return [];
                }


                return data;

            } catch (error) {

                console.error(
                    "Impossible de charger "
                    + "les actualités :",
                    error
                );

                return [];
            }
        }


        function saveActualites() {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    actualites
                )
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


            const maxLength = 160;


            return (
                text.length > maxLength
                    ? `${text.slice(
                        0,
                        maxLength
                    )}...`
                    : text
            );
        }


        // ====================================================
        // RENDU DE LA LISTE
        // ====================================================

        function renderNewsList() {

            newsList.innerHTML = "";


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
                        Aucune actualité pour le moment.
                    </p>

                    <button
                        type="button"
                        class="button-primary"
                        id="new-news-empty-button-rendered"
                    >
                        Créer la première actualité
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
                            openEditor();
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


                    const image =
                        document.createElement(
                            "div"
                        );

                    image.className =
                        "news-card-image";


                    if (
                        news.coverData
                    ) {

                        image.innerHTML = `
                            <img
                                src="${news.coverData}"
                                alt="${escapeHtml(
                                    news.title
                                )}"
                            >
                        `;
                    }


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


        // ====================================================
        // OUVRIR L'ÉDITEUR
        // ====================================================

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
                    return;
                }


                editorTitle.textContent =
                    "Modifier l'actualité";


                newsIdInput.value =
                    news.id;


                newsTitleInput.value =
                    news.title || "";


                newsDateInput.value =
                    news.date || "";


                newsContentInput.value =
                    news.content || "";


                coverFileName.textContent =
                    news.coverName
                    ||
                    "Image actuelle";


                imagesFileCount.textContent =
                    news.imageNames?.length
                        ? `${news.imageNames.length} photo(s)`
                        : "Aucune photo";


                if (news.coverData) {

                    previewImage.style
                        .backgroundImage =
                        `url("${news.coverData}")`;

                    previewImage.classList.add(
                        "has-image"
                    );

                    previewImage.textContent =
                        "";
                }


                previewTitle.textContent =
                    news.title
                    ||
                    "Titre de l'actualité";


                previewDate.textContent =
                    formatDate(
                        news.date
                    )
                    ||
                    "Date de l'actualité";


                previewText.textContent =
                    getPreviewText(
                        news.content
                    )
                    ||
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


        // ====================================================
        // FERMER L'ÉDITEUR
        // ====================================================

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


        // ====================================================
        // RÉINITIALISATION FORMULAIRE
        // ====================================================

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


        // ====================================================
        // IMAGE PRINCIPALE
        // ====================================================

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


        // ====================================================
        // PHOTOS DE L'ACTUALITÉ
        // ====================================================

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


        // ====================================================
        // APERÇU DU TITRE
        // ====================================================

        newsTitleInput.addEventListener(
            "input",
            () => {

                previewTitle.textContent =
                    newsTitleInput.value.trim()
                    ||
                    "Titre de l'actualité";
            }
        );


        // ====================================================
        // APERÇU DE LA DATE
        // ====================================================

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


        // ====================================================
        // APERÇU DE L'ARTICLE
        // ====================================================

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


        // ====================================================
        // CRÉER
        // ====================================================

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


        // ====================================================
        // RETOUR
        // ====================================================

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


        // ====================================================
        // ENREGISTREMENT
        // ====================================================

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


                let coverData =
                    null;


                let coverName =
                    "";


                if (
                    newsCoverInput.files[0]
                ) {

                    const coverFile =
                        newsCoverInput.files[0];


                    coverName =
                        coverFile.name;


                    coverData =
                        await fileToDataURL(
                            coverFile
                        );

                }


                const imageFiles =
                    Array.from(
                        newsImagesInput.files
                    );


                const imageData =
                    [];


                for (
                    const file of imageFiles
                ) {

                    imageData.push({
                        name: file.name,
                        data:
                            await fileToDataURL(
                                file
                            )
                    });

                }


                if (editingId) {

                    const newsIndex =
                        actualites.findIndex(
                            (item) =>
                                item.id === editingId
                        );


                    if (
                        newsIndex === -1
                    ) {

                        window.alert(
                            "Actualité introuvable."
                        );

                        return;
                    }


                    const existing =
                        actualites[
                            newsIndex
                        ];


                    actualites[
                        newsIndex
                    ] = {

                        ...existing,

                        title,

                        date,

                        content,

                        coverName:
                            coverName
                            ||
                            existing.coverName
                            ||
                            "",

                        coverData:
                            coverData
                            ||
                            existing.coverData
                            ||
                            null,

                        imageNames:
                            imageData.map(
                                (image) =>
                                    image.name
                            ),

                        images:
                            imageData
                    };


                } else {

                    actualites.push({

                        id:
                            generateId(),

                        title,

                        date,

                        content,

                        coverName,

                        coverData,

                        imageNames:
                            imageData.map(
                                (image) =>
                                    image.name
                            ),

                        images:
                            imageData,

                        createdAt:
                            new Date()
                                .toISOString()
                    });
                }


                saveActualites();

                closeEditor();

            }
        );


        // ====================================================
        // SUPPRESSION
        // ====================================================

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


            actualites =
                actualites.filter(
                    (item) =>
                        item.id !== newsId
                );


            saveActualites();

            renderNewsList();
        }


        // ====================================================
        // FILE → DATA URL
        // ====================================================

        function fileToDataURL(
            file
        ) {

            return new Promise(
                (resolve, reject) => {

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


        // ====================================================
        // INITIALISATION
        // ====================================================

        renderNewsList();


        const defaultTab =
            document.querySelector(
                ".gestion-tab.active"
            );


        if (defaultTab) {

            activateTab(
                defaultTab
            );
        }

    }
);