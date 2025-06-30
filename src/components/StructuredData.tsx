"use client";

import React from "react";
import Head from "next/head";

export default function StructuredData() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CHO A CHO",
    url: "https://www.choacho.com.ua",
    logo: "https://www.choacho.com.ua/logo.png",
    sameAs: [
      "https://www.instagram.com/choacho",
      "https://www.facebook.com/choachoshop",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+380 67 123 4567",
      contactType: "customer support",
      areaServed: "UA",
      availableLanguage: ["Ukrainian", "English"],
    },
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
