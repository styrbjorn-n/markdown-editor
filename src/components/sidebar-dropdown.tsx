import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export function SidebarDropdown({
  isOpen,
  entityName,
  isFolder = false,
}: {
  isOpen: boolean;
  entityName: string;
  isFolder?: boolean;
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
