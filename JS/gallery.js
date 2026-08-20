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

    imageElement.addEventListener("click", () => {

        const lightbox = document.getElementById("photo-lightbox");
        const lightboxImage = document.querySelector(".lightbox-image");

        lightboxImage.src = imageElement.src;
        lightboxImage.alt = imageElement.alt;

        lightbox.classList.add("active");
        lightbox.setAttribute("aria-hidden", "false");
    });

    item.appendChild(imageElement);

    gallery.appendChild(item);
});

const lightbox = document.getElementById("photo-lightbox");
const closeButton = document.querySelector(".lightbox-close");

if (lightbox && closeButton) {

    closeButton.addEventListener("click", () => {

        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

        const lightboxImage = document.querySelector(".lightbox-image");
        lightboxImage.src = "";
        lightboxImage.alt = "";
    });

    lightbox.addEventListener("click", (event) => {

        if (event.target === lightbox) {

            lightbox.classList.remove("active");
            lightbox.setAttribute("aria-hidden", "true");

            const lightboxImage = document.querySelector(".lightbox-image");
            lightboxImage.src = "";
            lightboxImage.alt = "";
        }
    });
}

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