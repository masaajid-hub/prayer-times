/**
 * Solar coordinates calculation following adhan-js exactly
 * Based on Astronomical Algorithms by Jean Meeus
 */

import {
  julianCentury,
  meanSolarLongitude,
  meanLunarLongitude,
  ascendingLunarNodeLongitude,
  apparentSolarLongitude,
  meanSiderealTime,
  nutationInLongitude,
  nutationInObliquity,
  meanObliquityOfTheEcliptic,
  apparentObliquityOfTheEcliptic,
} from "../utils/astronomy";

import { dtr, rtd, unwindAngle } from "../utils/math";

export class SolarCoordinates {
  declination: number;
  rightAscension: number;
  apparentSiderealTime: number;

  constructor(julianDay: number) {
    const T = julianCentury(julianDay);
    const L0 = meanSolarLongitude(T);
    const Lp = meanLunarLongitude(T);
    const Omega = ascendingLunarNodeLongitude(T);
    const Lambda = dtr(apparentSolarLongitude(T, L0));
    const Theta0 = meanSiderealTime(T);
    const dPsi = nutationInLongitude(T, L0, Lp, Omega);
    const dEpsilon = nutationInObliquity(T, L0, Lp, Omega);
    const Epsilon0 = meanObliquityOfTheEcliptic(T);
    const EpsilonApparent = dtr(apparentObliquityOfTheEcliptic(T, Epsilon0));

    /* declination: The declination of the sun, the angle between
            the rays of the Sun and the plane of the Earth's
            equator, in degrees.
            Equation from Astronomical Algorithms page 165 */
    this.declination = rtd(
      Math.asin(Math.sin(EpsilonApparent) * Math.sin(Lambda))
    );

    /* rightAscension: Right ascension of the Sun, the angular distance on the
            celestial equator from the vernal equinox to the hour circle,
            in degrees.
            Equation from Astronomical Algorithms page 165 */
    this.rightAscension = unwindAngle(
      rtd(
        Math.atan2(
          Math.cos(EpsilonApparent) * Math.sin(Lambda),
          Math.cos(Lambda)
        )
      )
    );

    /* apparentSiderealTime: Apparent sidereal time, the hour angle of the vernal
            equinox, in degrees.
            Equation from Astronomical Algorithms page 88 */
    this.apparentSiderealTime =
      Theta0 + (dPsi * 3600 * Math.cos(dtr(Epsilon0 + dEpsilon))) / 3600;
  }
}

export default SolarCoordinates;
