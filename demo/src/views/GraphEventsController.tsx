import { useRegisterEvents, useosigma } from "react-osigma-v2";
import { FC, useEffect } from "react";

function getMouseLayer() {
  return document.querySelector(".osigma-mouse");
}

const GraphEventsController: FC<{ setHoveredNode: (node: string | null) => void }> = ({ setHoveredNode, children }) => {
  const osigma = useosigma();
  const graph = osigma.getGraph();
  const registerEvents = useRegisterEvents();

  /**
   * Initialize here settings that require to know the graph and/or the osigma
   * instance:
   */
  useEffect(() => {
    registerEvents({
      clickNode({ node }) {
        if (!graph.getNodeAttribute(node, "hidden")) {
          window.open(graph.getNodeAttribute(node, "URL"), "_blank");
        }
      },
      enterNode({ node }) {
        setHoveredNode(node);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.add("mouse-pointer");
      },
      leaveNode() {
        setHoveredNode(null);
        // TODO: Find a better way to get the DOM mouse layer:
        const mouseLayer = getMouseLayer();
        if (mouseLayer) mouseLayer.classList.remove("mouse-pointer");
      },
    });
  }, []);

  return <>{children}</>;
};

export default GraphEventsController;
