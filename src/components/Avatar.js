import React from "react";

export default function Avatar({ player }) {
	let { score, color, name, pic } = player;

	return (
		<div
			style={{
				color,
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				borderBottom: "1px solid",
			}}
		>
			<img style={{ borderRadius: "50%" }} src={pic} alt="user photo" />
			<span>{name}</span>
			<span>{`Score: ${score}`} </span>
		</div>
	);
}
