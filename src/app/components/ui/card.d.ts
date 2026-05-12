import * as React from "react";

declare function Card(props: React.ComponentProps<"div">): JSX.Element;
declare function CardHeader(props: React.ComponentProps<"div">): JSX.Element;
declare function CardTitle(props: React.ComponentProps<"div">): JSX.Element;
declare function CardContent(props: React.ComponentProps<"div">): JSX.Element;

export { Card, CardHeader, CardTitle, CardContent };