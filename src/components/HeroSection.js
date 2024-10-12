import React from 'react';
import styles from './css/HeroSection.module.css'; 
import osuImage from '../assets/osu.jpg'; 

function HeroSection() {
  return (
    <div className={styles.heroContainer}>
      <h1 className={styles.heroTitle} >Welcome to the AI Platform Website!!!</h1>
      <img src={osuImage} alt="OSU" className={styles.heroImage} />
      <p className={styles.heroSubtitle}>Your gateway to advanced AI solutions</p>
      <button className={styles.heroButton}>Get Started</button>
    </div>
  );
}

export default HeroSection;
