import React from "react";
import styled from "styled-components";

export const CreateGameBtn = styled.button`
	font-family: monospace;
	color: green;
	background: lawngreen;
	border: black solid 1px;
	border-radius: 5px;
	padding: 0.5em;
	font-size: 15px;
	cursor: pointer;
`;

export const JoinGameBtn = styled.button`
	font-family: monospace;
	color: black;
	background: goldenrod;
	border: black solid 1px;
	border-radius: 5px;
	padding: 0.5em;
	font-size: 15px;
	cursor: pointer;
`;

export const Alert = styled.p`
	background: ${({ background }) => (background ? background : "tomato")};
	display: inline-block;
	font-family: monospace;
	font-size: 15px;

	padding: 0.5em;
	border: 1px solid #333;
	border-radius: 5px;
	margin: 1em;
`;
