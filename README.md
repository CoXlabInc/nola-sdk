# Nol.A SDK package

Nol.A is a SDK for IoT system development.

![Nol.A SDK](https://www.coxlab.kr/wp-content/uploads/2015/07/NOLA-1.png "Nol.A-SDK")

### Supports various development hardwares

* Arduino.org Arduino-M0 (experimental)
* CoXlab Nol.Board
* Nordic Semiconductor nRF51-DK, nRF51822-BK (experimental)
* Microchip/Atmel SAMR21 Xplained Pro (experimental)
* PLNetworks PLM100, PLM200
* ST Nucleo L152RE
* Texas Instruments TrxEB with CC1200EM
* Semtech SX1276MB1LAS (with base boards with Arduino connectors)

### Supports various wireless communications

#### PHYs

* IEEE 802.15.4 2.4GHz (DSSS)
* IEEE 802.15.4g 900MHz (FSK)
* Semtech LoRa
* Bluetooth Smart (LE)

#### MAC protocols

* LoRaWAN class A/C
* IEEE 802.15.4e-RIT based Low Power Probe MAC protocol
* Bluetooth Smart (LE)

### Automatically updates libraries

* Updates libraries for various development boards automatically
* Installs library-dependent GCC toolchains and flashing tools automatically

### Supports Arduino coding style with low-power operation

* Supports user-friendly Arduino coding style such as ```setup()```, ```digitalWrite()```, ```analogRead()```, and so on.
* Instead of ```loop()``` that makes CPU not to sleep, we support Timer and Task to schedule jobs.
