"use client";
import Header from "../components/Header/Header";
import WebBanner from "../components/Main/WebBanner";
import Gateway from "../components/Main/Gateway";
import Footer from "../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <WebBanner />
      <Gateway />
      <Footer />
    </>
  );
}
