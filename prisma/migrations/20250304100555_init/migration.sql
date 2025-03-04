-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "directors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,

    CONSTRAINT "directors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subCategories" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "subCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chronicles" (
    "id" SERIAL NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "link" TEXT NOT NULL,
    "createYear" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "genreId" INTEGER NOT NULL,
    "subCategoryId" INTEGER NOT NULL,
    "mainTitle" TEXT NOT NULL,
    "originalTitle" TEXT,
    "alternativeTitles" TEXT[],
    "releaseYear" INTEGER NOT NULL,
    "originCountry" TEXT[],
    "runtime" INTEGER,
    "tmdbId" INTEGER,

    CONSTRAINT "chronicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Raters" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Raters_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ChronicleToDirector" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ChronicleToDirector_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "directors_name_key" ON "directors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_title_key" ON "genres"("title");

-- CreateIndex
CREATE UNIQUE INDEX "genres_link_key" ON "genres"("link");

-- CreateIndex
CREATE UNIQUE INDEX "subCategories_title_key" ON "subCategories"("title");

-- CreateIndex
CREATE UNIQUE INDEX "subCategories_link_key" ON "subCategories"("link");

-- CreateIndex
CREATE UNIQUE INDEX "chronicles_link_key" ON "chronicles"("link");

-- CreateIndex
CREATE UNIQUE INDEX "chronicles_mainTitle_key" ON "chronicles"("mainTitle");

-- CreateIndex
CREATE INDEX "_Raters_B_index" ON "_Raters"("B");

-- CreateIndex
CREATE INDEX "_ChronicleToDirector_B_index" ON "_ChronicleToDirector"("B");

-- AddForeignKey
ALTER TABLE "subCategories" ADD CONSTRAINT "subCategories_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "genres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chronicles" ADD CONSTRAINT "chronicles_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "subCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Raters" ADD CONSTRAINT "_Raters_A_fkey" FOREIGN KEY ("A") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Raters" ADD CONSTRAINT "_Raters_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChronicleToDirector" ADD CONSTRAINT "_ChronicleToDirector_A_fkey" FOREIGN KEY ("A") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ChronicleToDirector" ADD CONSTRAINT "_ChronicleToDirector_B_fkey" FOREIGN KEY ("B") REFERENCES "directors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
