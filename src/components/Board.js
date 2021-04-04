import React from "react";
import styled, { keyframes } from "styled-components";
import Reward from "react-rewards";

class Box extends React.Component {
	constructor(props) {
		console.log({ props });
		super(props);
	}
	componentDidUpdate(prevProps) {
		if (prevProps.color === "pending") {
			if (this.props.color === this.props.userColor) {
				this.reward.rewardMe();
			} else {
				this.reward.punishMe();
			}
		}
	}
	render() {
		return (
			<StyledBox
				color={this.props.color}
				onMouseDown={() => this.props.onClick(this.props.id)}
			>
				<Reward
					ref={(ref) => {
						this.reward = ref;
					}}
					type="confetti"
					config={{
						lifetime: 10,
						// angle: 90,
						elementCount: 100,
						decay: 1,
						spread: 360,
						startVelocity: 10,
						// springAnimation: false,
						colors: ["Red", "yellow", "green", "blue"],
					}}
				></Reward>
			</StyledBox>
		);
	}
}

export const Board = ({ game, selectBox, userColor }) => {
	return (
		<BoardContainer>
			{game.boxes.map(({ id, color }) => {
				return (
					<Box
						userColor={userColor}
						shake={id >= 45 && id < 46}
						color={color}
						onClick={selectBox}
						id={id}
						key={id}
					/>
				);
			})}
		</BoardContainer>
	);
};

const spin = keyframes`
0%{transform:rotate(0deg)}
100%{transform:rotate(360deg)}
`;

const StyledBox = styled.div`
	overflow: hidden;
	width: 50px;
	height: 50px;
	background-color: ${({ color }) => (color ? color : "white")};
	border: 1px solid black;
	vertical-align: bottom;
	box-sizing: border-box;
	display: inline-flex;
	cursor: pointer;
	/* justify-content: center;
	align-items: center;
	&:after {
		content: "${({ color }) => {
		if (color === "pending") return "?";
		if (color) return color;
	}}";
	} */
`;

const BoardContainer = styled.div`
	max-width: 500px;
`;
