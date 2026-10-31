"""Abstract base class for all ARDI agents."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from app.core.logging_cfg import get_logger

log = get_logger(__name__)


class BaseAgent(ABC):
    """Abstract base for all ARDI decision agents.

    Subclasses must define:
        - ``agent_name`` – a unique human-readable name
        - ``run(context)``  – main entry point
        - ``validate_output(output)`` – sanity-check the returned dict

    Attributes
    ----------
    agent_name : str
        Unique name identifying this agent type.
    agent_version : str
        Semantic version string; defaults to "1.0.0".
    """

    agent_name: str = "BaseAgent"
    agent_version: str = "1.0.0"

    @abstractmethod
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's core logic.

        Parameters
        ----------
        context : dict
            Input payload; structure is agent-specific.

        Returns
        -------
        dict
            Output payload; structure is agent-specific.
        """
        ...

    @abstractmethod
    def validate_output(self, output: Dict[str, Any]) -> bool:
        """Validate that *output* conforms to the expected schema.

        Parameters
        ----------
        output : dict
            The dict returned by :meth:`run`.

        Returns
        -------
        bool
            ``True`` if output is valid, ``False`` otherwise.
        """
        ...

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.agent_name!r} v{self.agent_version}>"
