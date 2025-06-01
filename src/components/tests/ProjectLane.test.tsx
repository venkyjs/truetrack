import { render, screen, fireEvent, within } from '@testing-library/react';
import ProjectLane from '../ProjectLane'; // Adjust path if ProjectLane.tsx is elsewhere
import '@testing-library/jest-dom';
import { Project, Person, Task, TaskItem } from '../../types'; // Adjust path to your types

// Mock necessary props. electronAPI calls for activities are not directly used by ProjectLane for rendering tasks.
// Those are handled by parent via props like onAddTask, onUpdateTask etc.
const mockElectronAPI = {
  getPreferences: vi.fn().mockResolvedValue({ displayTimeInDecimal: false }), // Keep if Coloris or other parts might use it indirectly
};

beforeAll(() => {
  // @ts-expect-error - Mocking a global object
  window.electronAPI = mockElectronAPI;
});

// Define mock functions for props
const mockOnDeleteProject = vi.fn();
const mockOnUpdateProjectTitle = vi.fn();
const mockOnAddTask = vi.fn();
const mockOnUpdateTask = vi.fn();
const mockOnDeleteTask = vi.fn();
const mockOnUpdateProjectTaskColor = vi.fn();
const mockFindOrCreatePerson = vi.fn().mockImplementation((name) => `person-${name.toLowerCase()}`);
const mockPeople: Person[] = [
    { id: 'person-john', name: 'John Doe', initials: 'JD' }
];

// Define tasks and project data to be used by tests and renderProjectLane
const task1: Task = { // Explicitly type for clarity
  id: 'task1',
  title: 'Doing some work',
  items: [{id: 'item1', text: 'sub item 1', completed: false}],
  assignedPersons: [],
  reminder: null,
  completed: false,
  project_id: '1', // Added project_id as it's part of Task type
  sort_order: 1,  // Added sort_order
};
const task2: Task = { // Explicitly type
  id: 'task2',
  title: 'Completed work',
  items: [],
  assignedPersons: [],
  reminder: null,
  completed: true,
  project_id: '1', // Added project_id
  sort_order: 2,  // Added sort_order
};

const mockProjectWithTasks: Project = {
  id: '1',
  title: 'Test Project',
  directory: '/test/project',
  color: '#aabbcc',
  taskColor: '#aabbcc',
  tasks: [task1, task2],
  lastOpened: new Date().toISOString(), // Added lastOpened
};

// Helper function to render ProjectLane with default mocks
// Ensure ProjectLaneProps is correctly defined or imported if it's a separate type
interface ProjectLaneProps {
    project: Project;
    people: Person[];
    findOrCreatePerson: (name: string) => string;
    onDeleteProject: (projectId: string) => void;
    onUpdateProjectTitle: (projectId: string, newTitle: string) => void;
    onAddTask: (projectId: string, taskTitle: string) => void;
    onUpdateTask: (
        projectId: string,
        taskId: string,
        updatedTaskData: Partial<Omit<Task, 'id'>>
    ) => void;
    onDeleteTask: (projectId: string, taskId: string) => void;
    onUpdateProjectTaskColor: (projectId: string, color?: string) => void;
}


const renderProjectLane = (projectProps: Partial<ProjectLaneProps> = {}) => {
  const defaultProps: ProjectLaneProps = {
    project: mockProjectWithTasks,
    people: mockPeople,
    findOrCreatePerson: mockFindOrCreatePerson,
    onDeleteProject: mockOnDeleteProject,
    onUpdateProjectTitle: mockOnUpdateProjectTitle,
    onAddTask: mockOnAddTask,
    onUpdateTask: mockOnUpdateTask,
    onDeleteTask: mockOnDeleteTask,
    onUpdateProjectTaskColor: mockOnUpdateProjectTaskColor,
    ...projectProps,
  };
  // @ts-ignore - ProjectLane might expect other props from the original full app context not covered in this minimal setup
  return render(<ProjectLane {...defaultProps} />);
};


describe('ProjectLane component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    mockElectronAPI.getPreferences.mockResolvedValue({ displayTimeInDecimal: false });
  });

  it('renders project title and task color', () => {
    renderProjectLane();
    expect(screen.getByText(mockProjectWithTasks.title)).toBeInTheDocument();

    // The styles object won't be available here directly.
    // We need to get the element and check its style attribute or computed style.
    // For this specific check, it's better to rely on a data-testid or a more robust selector if possible.
    // However, if ProjectLane.module.css is indeed transforming class names,
    // we might need to use a partial class name match or check the style attribute directly.
    const laneContainer = screen.getByText(mockProjectWithTasks.title).closest('div[style*="border-top"]');
    expect(laneContainer).toHaveStyle(`border-top: 5px solid ${mockProjectWithTasks.taskColor}`);
  });

  it('loads and displays tasks from project prop', async () => {
    renderProjectLane();
    expect(await screen.findByText(task1.title)).toBeInTheDocument();
    expect(await screen.findByText(task2.title)).toBeInTheDocument();
    expect(await screen.findByText(task1.items[0].text)).toBeInTheDocument();
  });

  it('calls onAddTask when adding a new task', async () => {
    renderProjectLane();
    const newTaskInput = screen.getByPlaceholderText('Add new task...');
    // The button has "Add" text content and FontAwesomeIcon
    const addTaskButton = screen.getByRole('button', { name: /Add/i });

    fireEvent.change(newTaskInput, { target: { value: 'A brand new task' } });
    fireEvent.click(addTaskButton);

    expect(mockOnAddTask).toHaveBeenCalledWith(mockProjectWithTasks.id, 'A brand new task');
  });


  it('calls onDeleteTask when deleting a task', async () => {
    renderProjectLane();
    const task1TitleElement = await screen.findByText(task1.title);

    // Get the grandparent, which should be the taskCard
    const taskCard = task1TitleElement.parentElement?.parentElement;

    expect(taskCard).not.toBeNull(); // Check if taskCard was found

    if (taskCard) {
        // The Tippy component on the delete button has content 'Delete Task'
        // So the button should be findable by this accessible name.
        const deleteButton = within(taskCard).getByRole('button', { name: /Delete Task/i });
        fireEvent.click(deleteButton);
        expect(mockOnDeleteTask).toHaveBeenCalledWith(mockProjectWithTasks.id, task1.id);
    } else {
        throw new Error("Could not find task card for deletion test. The className `styles.taskCard` might not be available or the DOM structure is different than expected.");
    }
  });

  it('calls onUpdateTask when editing a task title', async () => {
    renderProjectLane();
    const taskTitleElement = await screen.findByText(task1.title);
    fireEvent.doubleClick(taskTitleElement);

    const editInput = await screen.findByDisplayValue(task1.title);
    fireEvent.change(editInput, { target: { value: 'Updated Task Title' } });
    fireEvent.blur(editInput);

    expect(mockOnUpdateTask).toHaveBeenCalledWith(
      mockProjectWithTasks.id,
      task1.id,
      { title: 'Updated Task Title' }
    );
  });
});
