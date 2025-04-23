import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function SidebarDropdown({
  isOpen,
  entityName,
}: {
  isOpen: boolean;
  entityName: string;
}) {
  return (
    <DropdownMenu open={isOpen}>
      <DropdownMenuContent>
        <DropdownMenuLabel>{entityName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
