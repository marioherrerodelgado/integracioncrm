// En la web la demo no carga nada de fuera: React va dentro del paquete.
import React from "react";
import * as ReactDOM from "react-dom/client";
window.React = React;
window.ReactDOM = ReactDOM;
