import React, { useState, useEffect } from "react";

import styled from "styled-components";

export const CountDown = () => {
	const large = 200;
	const small = 100;
	const [time, setTime] = useState(3);
	const [size, setSize] = useState(large);
	const [opacity, setOpacity] = useState(1);
	useEffect(() => {
		let timer1 = setInterval(
			() =>
				setTime((time) => {
					debugger;
					if (time === 0) {
						clearInterval(timer1);
						setOpacity(0);
						return "GOOO!!!!!";
					} else return time - 1;
				}),
			1000
		);
		let timer2 = setInterval(() => {
			setSize((size) => {
				if (size === small) {
					return large;
				} else return small;
			});
		}, 500);

		return () => {
			clearInterval(timer1);
			clearInterval(timer2);
		};
	}, []);

	return (
		<CountDownContainer>
			<AnimatedNumber opacity={opacity} size={size}>
				{time}
			</AnimatedNumber>
		</CountDownContainer>
	);
};

const CountDownContainer = styled.div`
	z-index: 10;
	overflow: hidden;
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;
	top: 0;
	left: 0;
	bottom: 0;
	right: 0;
`;
const AnimatedNumber = styled.p`
	opacity: ${({ opacity }) => opacity};
	position: absolute;
	font-size: ${({ size }) => `${size}px`};
	transition: all 0.5s ease-in-out;
`;
