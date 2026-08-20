document.addEventListener("DOMContentLoaded", async () => {

    const gallery = document.getElementById("apam-gallery");

    if (!gallery) {
        return;
    }

    try {

        const response = await fetch("./data/images.json");

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const images = await response.json();

        gallery.innerHTML = "";

        if (!Array.isArray(images) || images.length === 0) {
            gallery.innerHTML = `
                <p class="gallery-empty">
                    Aucune photo disponible pour le moment.
                </p>
            `;
            return;
        }

        images.forEach((image) => {

            const item = document.createElement("article");
            item.className = "gallery-item";

            const imageElement = document.createElement("img");

            imageElement.src = `assets/image-apam/${image.file}`;
            imageElement.alt = image.title || "Photo de l'APAM";
            imageElement.loading = "lazy";

            item.appendChild(imageElement);

            gallery.appendChild(item);
        });

    } catch (error) {

        console.error(
            "Impossible de charger la galerie APAM :",
            error
        );

        gallery.innerHTML = `
            <p class="gallery-error">
                Impossible de charger les photos.
            </p>
        `;
    }
});