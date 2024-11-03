import React from "react";
import styles from "./css/HeroSection.module.css";
import osuImage from "../assets/osu.jpg";
import { Link } from "react-router-dom";

function HeroSection() {
  return (
    <div className={styles.heroContainer}>
      <h1 className={styles.heroTitle}>Welcome to the AI Platform Website!!!</h1>
      <img src={osuImage} alt="OSU" className={styles.heroImage} />
      <p className={styles.heroSubtitle}>Your gateway to advanced AI solutions</p>
      <Link to="/projects" className={styles.heroButtonLink}>
        <button className={styles.heroButton}>Get Started</button>
      </Link>
    </div>
  );
}

export default HeroSection;
