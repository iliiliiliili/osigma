/**
 * osigma.js Touch Captor
 * ======================
 *
 * osigma's captor dealing with touch.
 * @module
 */
import { CameraState, Coordinates, Dimensions, TouchCoords } from "../../types";
import Captor from "./captor";
import osigma from "../../osigma";
export declare type FakeosigmaMouseEvent = MouseEvent & {
    isFakeosigmaMouseEvent?: true;
};
/**
 * Event types.
 */
export declare type TouchCaptorEvents = {
    touchdown(coordinates: TouchCoords): void;
    touchup(coordinates: TouchCoords): void;
    touchmove(coordinates: TouchCoords): void;
};
/**
 * Touch captor class.
 *
 * @constructor
 */
export default class TouchCaptor extends Captor<TouchCaptorEvents> {
    enabled: boolean;
    isMoving: boolean;
    hasMoved: boolean;
    startCameraState?: CameraState;
    touchMode: number;
    movingTimeout?: number;
    startTouchesAngle?: number;
    startTouchesDistance?: number;
    startTouchesPositions: Coordinates[];
    lastTouchesPositions?: Coordinates[];
    lastTouches?: Touch[];
    constructor(container: HTMLElement, renderer: osigma);
    kill(): void;
    getDimensions(): Dimensions;
    dispatchRelatedMouseEvent(type: string, e: TouchEvent, touch?: Touch, emitter?: EventTarget): void;
    handleStart(e: TouchEvent): void;
    handleLeave(e: TouchEvent): void;
    handleMove(e: TouchEvent): void;
}
